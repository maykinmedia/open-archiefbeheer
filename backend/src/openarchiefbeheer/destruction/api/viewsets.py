from datetime import date, timedelta

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Prefetch, QuerySet
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from timeline_logger.models import TimelineLog

from openarchiefbeheer.logging import logevent
from openarchiefbeheer.utils.paginators import PageNumberPagination
from openarchiefbeheer.zaken.api.filtersets import ZaakFilter

from ..constants import WAITING_PERIOD, InternalStatus, ListRole
from ..models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewResponse,
)
from ..tasks import delete_destruction_list
from ..utils import process_new_reviewer
from .backends import NestedFilterBackend
from .filtersets import (
    DestructionListFilterset,
    DestructionListItemFilterset,
    DestructionListReviewFilterset,
    DestructionListReviewItemFilterset,
    ReviewResponseFilterset,
)
from .permissions import (
    CanAbortDestruction,
    CanMarkAsReadyToReview,
    CanMarkListAsFinal,
    CanReassignDestructionList,
    CanReviewPermission,
    CanStartDestructionPermission,
    CanTriggerDeletion,
    CanUpdateCoReviewers,
    CanUpdateDestructionList,
)
from .serializers import (
    AbortDestructionSerializer,
    AuditTrailItemSerializer,
    CoReviewerAssignementSerializer,
    DestructionListAssigneeReadSerializer,
    DestructionListItemReadSerializer,
    DestructionListItemReviewSerializer,
    DestructionListReadSerializer,
    DestructionListReviewSerializer,
    DestructionListWriteSerializer,
    MarkAsFinalSerializer,
    ReassignementSerializer,
    ReviewerAssigneeSerializer,
    ReviewResponseSerializer,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Destruction list"],
        summary=_("List destruction lists"),
        description=_("List all destruction lists."),
        responses={200: DestructionListReadSerializer(many=True)},
    ),
    create=extend_schema(
        tags=["Destruction list"],
        summary=_("Create destruction list"),
        description=_("Create a new destruction list."),
        examples=[
            OpenApiExample(
                name="Example list creation",
                request_only=True,
                value={
                    "name": "An example list",
                    "containsSensitiveInfo": True,
                    "assignees": [
                        {
                            "user": 1,
                        },
                        {
                            "user": 2,
                        },
                    ],
                    "add": [
                        {
                            "zaak": "http://some-zaken-api.nl/zaken/api/v1/zaken/111-111-111",
                            "extraZaakData": {},
                        },
                        {
                            "zaak": "http://some-zaken-api.nl/zaken/api/v1/zaken/222-222-222",
                            "extraZaakData": {},
                        },
                    ],
                },
            )
        ],
    ),
    update=extend_schema(
        tags=["Destruction list"],
        summary=_("Update destruction list"),
        description=_(
            "Update a destruction list. "
            "The cases are updated in bulk. "
            "The assignees can only be changed through the 'reassign' endpoint."
        ),
        examples=[
            OpenApiExample(
                name="Add/remove items",
                request_only=True,
                value={
                    "name": "An example updated list",
                    "containsSensitiveInfo": False,
                    "add": [
                        {
                            "zaak": "http://some-zaken-api.nl/zaken/api/v1/zaken/111-111-111",
                            "extraZaakData": {},
                        },
                    ],
                    "remove": [
                        {
                            "zaak": "http://some-zaken-api.nl/zaken/api/v1/zaken/222-222-222",
                            "extraZaakData": {},
                        },
                    ],
                },
            ),
        ],
    ),
    partial_update=extend_schema(
        tags=["Destruction list"],
        summary=_("Partially update a destruction list"),
        description=_(
            "Partially update a destruction list. "
            "The cases are updated in bulk. "
            "The assignees can only be changed through the 'reassign' endpoint."
        ),
        examples=[
            OpenApiExample(
                name="Example list partial update",
                value={
                    "name": "Partially updated list",
                },
                request_only=True,
            )
        ],
    ),
    retrieve=extend_schema(
        tags=["Destruction list"],
        summary=_("Retrieve destruction list"),
        description=_("Retrieve details about a destruction list."),
        responses={200: DestructionListReadSerializer},
    ),
    destroy=extend_schema(
        tags=["Destruction list"],
        summary=_("Destroy destruction list"),
        description=_(
            "Calling this endpoint will start a background process that will "
            "delete the cases in the list from the case system."
        ),
    ),
    make_final=extend_schema(
        tags=["Destruction list"],
        summary=_("Make destruction list final"),
        description=_(
            "Change the status of a destruction list to 'final' and assign an archivist to it."
        ),
        request=ReviewerAssigneeSerializer,
        responses={201: None},
    ),
    reassign=extend_schema(
        tags=["Destruction list"],
        summary=_("Reassign the destruction list to new assignees."),
        description=_(
            "This endpoint can be used to change the users that are assigned to a list."
        ),
        request=ReassignementSerializer,
        responses={200: None},
    ),
    auditlog=extend_schema(
        tags=["Destruction list"],
        summary=_("Retrieve audit log."),
        description=_("Retrieve the audit log for this destruction list."),
        responses={200: AuditTrailItemSerializer(many=True)},
    ),
    mark_ready_review=extend_schema(
        tags=["Destruction list"],
        summary=_("Mark as ready to review."),
        description=_(
            "This endpoint can be used to mark a new list as 'ready to review' and assign the first reviewer to it."
        ),
        responses={201: None},
    ),
    abort_destruction=extend_schema(
        tags=["Destruction list"],
        summary=_("Abort planned destruction"),
        description=_(
            "This endpoint can be used to abort the destruction of a list when the date to process it has been set."
            " The status of the list is then set back to 'new' and the record manager is re-assigned to it."
        ),
        request=AbortDestructionSerializer,
        responses={200: None},
    ),
)
class DestructionListViewSet(
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DestructionListWriteSerializer
    queryset = (
        DestructionList.objects.all()
        .select_related("author", "assignee")
        .prefetch_related(
            Prefetch(
                "assignees",
                queryset=DestructionListAssignee.objects.prefetch_related(
                    "user__user_permissions"
                ).order_by("pk"),
            )
        )
    )
    lookup_field = "uuid"
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DestructionListFilterset

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated & CanStartDestructionPermission]
        elif self.action == "update":
            permission_classes = [IsAuthenticated & CanUpdateDestructionList]
        elif self.action == "destroy":
            permission_classes = [IsAuthenticated & CanTriggerDeletion]
        elif self.action == "make_final":
            permission_classes = [IsAuthenticated & CanMarkListAsFinal]
        elif self.action == "reassign":
            permission_classes = [IsAuthenticated & CanReassignDestructionList]
        elif self.action == "auditlog":
            permission_classes = [IsAuthenticated]
        elif self.action == "mark_ready_review":
            permission_classes = [IsAuthenticated & CanMarkAsReadyToReview]
        elif self.action == "abort_destruction":
            permission_classes = [IsAuthenticated & CanAbortDestruction]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ["retrieve", "list"]:
            return DestructionListReadSerializer
        return self.serializer_class

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance: DestructionList) -> None:
        today = date.today()
        destruction_date = today + timedelta(days=WAITING_PERIOD)
        if not instance.all_items_can_be_deleted_by_date(destruction_date):
            raise ValidationError(
                _(
                    "This list contains cases with archiving date later than %(destruction_date)s, "
                    "so the destruction cannot be planned yet."
                )
                % {"destruction_date": destruction_date.strftime("%d/%m/%Y")}
            )

        if (
            instance.planned_destruction_date
            and instance.planned_destruction_date > today
        ):
            raise ValidationError(
                _(
                    "This list is already planned to be destroyed on %(destruction_date)s."
                )
                % {"destruction_date": destruction_date.strftime("%d/%m/%Y")}
            )

        if instance.processing_status == InternalStatus.new:
            instance.planned_destruction_date = today + timedelta(days=WAITING_PERIOD)
            instance.save()
            return

        # If it is a retry, process immediately
        delete_destruction_list(instance)

    @action(detail=True, methods=["post"], name="make-final")
    def make_final(self, request, *args, **kwargs):
        destruction_list = self.get_object()
        serialiser = MarkAsFinalSerializer(data=request.data)
        serialiser.is_valid(raise_exception=True)

        assignee = DestructionListAssignee(
            user=serialiser.validated_data["user"],
            destruction_list=destruction_list,
            role=ListRole.archivist,
        )
        assignee.save()

        destruction_list.assign_next()

        logevent.destruction_list_finalized(
            destruction_list,
            serialiser.validated_data["comment"],
            archivist=assignee.user,
            record_manager=request.user,
        )

        return Response(status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], name="reassign")
    def reassign(self, request, *args, **kwargs):
        destruction_list = self.get_object()
        serialiser = ReassignementSerializer(
            data=request.data,
            context={"destruction_list": destruction_list, "request": request},
        )
        serialiser.is_valid(raise_exception=True)

        new_assignee = process_new_reviewer(
            destruction_list,
            serialiser.validated_data["assignee"]["user"],
        )
        destruction_list.reassign()

        logevent.destruction_list_reassigned(
            destruction_list,
            new_assignee,
            serialiser.validated_data["comment"],
            request.user,
        )
        return Response()

    @action(detail=True, methods=["get"], name="audit_log")
    def auditlog(self, request, *args, **kwargs):
        destruction_list = self.get_object()
        items = TimelineLog.objects.filter(
            content_type=ContentType.objects.get_for_model(DestructionList),
            object_id=destruction_list.pk,
        )
        serializer = AuditTrailItemSerializer(instance=items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], name="mark-ready-review")
    def mark_ready_review(self, request, *args, **kwargs):
        destruction_list = self.get_object()

        destruction_list.assign_next()

        return Response(status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], name="abort-destruction")
    def abort_destruction(self, request, *args, **kwargs):
        destruction_list = self.get_object()

        serializer = AbortDestructionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        destruction_list.abort_destruction()

        return Response()


@extend_schema_view(
    list=extend_schema(
        tags=["Destruction list"],
        summary=_("List destruction list items"),
        description=_(
            "List all the items (cases) that are related to a destruction list."
        ),
    ),
)
class DestructionListItemsViewSet(
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DestructionListItemReadSerializer
    queryset = DestructionListItem.objects.all().select_related("zaak")
    filter_backends = (NestedFilterBackend,)
    filterset_class = DestructionListItemFilterset
    filterset_kwargs = {"prefix": "item"}
    nested_filterset_class = ZaakFilter
    nested_filterset_relation_field = "zaak"
    pagination_class = PageNumberPagination


@extend_schema_view(
    list=extend_schema(
        tags=["Reviews"],
        summary=_("List reviews"),
        description=_(
            "List all the reviews that have been made for a destruction list."
        ),
    ),
    create=extend_schema(
        tags=["Reviews"],
        summary=_("Create review"),
        description=_(
            "Create a review for a destruction list. "
            "Only the user currently assigned to the destruction list can create a review."
        ),
    ),
)
class DestructionListReviewViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DestructionListReviewSerializer
    queryset = DestructionListReview.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DestructionListReviewFilterset

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated & CanReviewPermission]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


@extend_schema_view(
    list=extend_schema(
        tags=["Reviews"],
        summary=_("List review items"),
        description=_(
            "List all the feedback to specific cases within a destruction list."
        ),
    ),
)
class DestructionListItemReviewViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = DestructionListItemReviewSerializer
    queryset = DestructionListItemReview.objects.all().select_related(
        "destruction_list_item__zaak"
    )
    filterset_class = DestructionListReviewItemFilterset
    filter_backends = (NestedFilterBackend,)
    filterset_kwargs = {"prefix": "item-review"}
    nested_filterset_class = ZaakFilter
    nested_filterset_relation_field = "destruction_list_item__zaak"


@extend_schema_view(
    list=extend_schema(
        tags=["Reviews"],
        summary=_("List review responses"),
        description=_("List all the responses to the reviews of a destruction list."),
    ),
    create=extend_schema(
        tags=["Reviews"],
        summary=_("Create a review response"),
        description=_(
            "Create a response to a review. "
            "You need to be the author of a destruction list for this and you need to be assigned to it. "
            "The status of the destruction list must be 'changes requested'."
        ),
    ),
)
class ReviewResponseViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    serializer_class = ReviewResponseSerializer
    queryset = ReviewResponse.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ReviewResponseFilterset

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated & CanStartDestructionPermission]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


@extend_schema_view(
    list=extend_schema(
        tags=["Destruction list"],
        summary=_("List co-reviewers"),
        description=_("List all the co-reviewers assigned to a destruction list."),
    ),
    update=extend_schema(
        tags=["Destruction list"],
        summary=_("Update co-reviewers"),
        description=_(
            "Full update of the co-reviewers assigned to a destruction list."
        ),
        request=CoReviewerAssignementSerializer,
        responses={200: DestructionListAssigneeReadSerializer},
    ),
    partial_update=extend_schema(
        tags=["Destruction list"],
        summary=_("Partial update co-reviewers"),
        description=_(
            "Partial update of the co-reviewers assigned to a destruction list."
        ),
        request=CoReviewerAssignementSerializer,
        responses={200: DestructionListAssigneeReadSerializer},
    ),
)
class CoReviewersViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    def _get_destruction_list(self) -> DestructionList:
        return get_object_or_404(
            DestructionList, uuid=self.kwargs["destruction_list_uuid"]
        )

    def get_queryset(self):
        return DestructionListAssignee.objects.filter(
            destruction_list__uuid=self.kwargs["destruction_list_uuid"],
            role=ListRole.co_reviewer,
        )

    def get_object(self) -> QuerySet[DestructionListAssignee]:
        destruction_list = self._get_destruction_list()

        self.check_object_permissions(self.request, destruction_list)
        return destruction_list.assignees.filter(role=ListRole.co_reviewer)

    def check_object_permissions(
        self, request, obj: DestructionList | QuerySet[DestructionListAssignee]
    ):
        # Needed to get the DRF interactive page to test out the endpoints.
        # FIXME: For PUT/PATCH operations it shows a funny rendered response, but
        # it only happens if using the DRF interactive page
        if isinstance(obj, QuerySet):
            obj = self._get_destruction_list()
        return super().check_object_permissions(request, obj)

    def get_serializer_class(self):
        match self.action:
            case "list":
                return DestructionListAssigneeReadSerializer
            case "update" | "partial_update" | "create":
                return CoReviewerAssignementSerializer

    def get_permissions(self):
        if self.action in ["update", "partial_upate"]:
            permission_classes = [IsAuthenticated & CanUpdateCoReviewers]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"destruction_list": self._get_destruction_list()})
        return context
