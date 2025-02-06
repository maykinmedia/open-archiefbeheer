from datetime import date, timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Case, OuterRef, Q, QuerySet, Subquery, Value, When
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from requests.exceptions import ConnectionError, HTTPError, RequestException, Timeout
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from slugify import slugify
from zgw_consumers.client import build_client
from zgw_consumers.models import Service

from openarchiefbeheer.logging import logevent
from openarchiefbeheer.utils.paginators import PageNumberPagination
from openarchiefbeheer.zaken.api.filtersets import ZaakFilterSet
from openarchiefbeheer.zaken.models import Zaak

from ..constants import DestructionListItemAction, InternalStatus, ListRole, ListStatus
from ..models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListCoReview,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewItemResponse,
    ReviewResponse,
)
from ..tasks import delete_destruction_list
from ..utils import process_new_reviewer
from .backends import NestedFilterBackend, NestedOrderingFilterBackend
from .filtersets import (
    DestructionListCoReviewFilterset,
    DestructionListFilterset,
    DestructionListItemFilterset,
    DestructionListReviewFilterset,
    DestructionListReviewItemFilterset,
    ReviewResponseFilterset,
)
from .mixins import DestructionListChecksMixin
from .permissions import (
    CanAbortDestruction,
    CanCoReviewPermission,
    CanDeleteList,
    CanDownloadReport,
    CanMarkAsReadyToReview,
    CanMarkListAsFinal,
    CanQueueDestruction,
    CanReassignDestructionList,
    CanReviewPermission,
    CanStartDestructionPermission,
    CanUpdateCoReviewers,
    CanUpdateDestructionList,
)
from .serializers import (
    AbortDestructionSerializer,
    CoReviewerAssignmentSerializer,
    DestructionListAssigneeReadSerializer,
    DestructionListCoReviewSerializer,
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
                    "reviewer": 1,
                    "add": [
                        {
                            "zaak": "http://some-zaken-api.nl/zaken/api/v1/zaken/111-111-111",
                        },
                        {
                            "zaak": "http://some-zaken-api.nl/zaken/api/v1/zaken/222-222-222",
                        },
                    ],
                    "selectAll": True,
                    "zaak_filters": {
                        "zaaktype__omschrijving__icontains": "Some zaaktype omschrijving."
                    },
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
                        },
                    ],
                    "remove": [
                        {
                            "zaak": "http://some-zaken-api.nl/zaken/api/v1/zaken/222-222-222",
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
        summary=_("Delete destruction list"),
        description=_(
            "Delete a destruction list. Can only be used for lists with status 'new'."
        ),
        request=None,
        responses={204: None},
    ),
    queue_destruction=extend_schema(
        tags=["Destruction list"],
        summary=_("Queue destruction list destruction"),
        description=_(
            "Calling this endpoint will queue a background process that will "
            "delete the cases in the list from the case system."
        ),
        request=None,
        responses={200: None},
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
    mark_ready_review=extend_schema(
        tags=["Destruction list"],
        summary=_("Mark as ready to review."),
        description=_(
            "This endpoint can be used to mark a new list as 'ready to review' and assign the first reviewer to it."
        ),
        responses={201: None},
    ),
    abort=extend_schema(
        tags=["Destruction list"],
        summary=_('"Abort" destruction list'),
        description=_(
            'Sets the status of the destruction list to "new", cancels if the destruction list is due to be destroyed.'
        ),
        request=AbortDestructionSerializer,
        responses={200: None},
    ),
    download_report=extend_schema(
        tags=["Destruction list"],
        summary=_("Download destruction report"),
        request=None,
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

    # `queryset` is required for the DRF router to dynamically pickup the "basename". However, we use the
    # `get_queryset()` method to restrict items based on the user. We use `DestructionList.objects.none()` as
    # failsafe default.
    queryset = DestructionList.objects.none()

    lookup_field = "uuid"
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DestructionListFilterset

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated & CanStartDestructionPermission]
        elif self.action == "update":
            permission_classes = [IsAuthenticated & CanUpdateDestructionList]
        elif self.action == "destroy":
            permission_classes = [IsAuthenticated & CanDeleteList]
        elif self.action == "queue_destruction":
            permission_classes = [IsAuthenticated & CanQueueDestruction]
        elif self.action == "make_final":
            permission_classes = [IsAuthenticated & CanMarkListAsFinal]
        elif self.action == "reassign":
            permission_classes = [IsAuthenticated & CanReassignDestructionList]
        elif self.action == "mark_ready_review":
            permission_classes = [IsAuthenticated & CanMarkAsReadyToReview]
        elif self.action == "abort":
            permission_classes = [IsAuthenticated & CanAbortDestruction]
        elif self.action == "download_report":
            permission_classes = [IsAuthenticated & CanDownloadReport]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        return DestructionList.objects.permitted_for_user(
            self.request.user
        ).annotate_user_permissions()

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

    @action(detail=True, methods=["post"], name="queue-destruction")
    def queue_destruction(self, request, *args, **kwargs) -> None:
        destruction_list = self.get_object()

        today = date.today()
        destruction_date = today + timedelta(days=settings.WAITING_PERIOD)
        if not destruction_list.all_items_can_be_deleted_by_date(destruction_date):
            raise ValidationError(
                _(
                    "This list contains cases with archiving date later than %(destruction_date)s, "
                    "so the destruction cannot be planned yet."
                )
                % {"destruction_date": destruction_date.strftime("%d/%m/%Y")}
            )

        if (
            destruction_list.planned_destruction_date
            and destruction_list.planned_destruction_date > today
        ):
            raise ValidationError(
                _(
                    "This list is already planned to be destroyed on %(destruction_date)s."
                )
                % {"destruction_date": destruction_date.strftime("%d/%m/%Y")}
            )

        logevent.destruction_list_deletion_triggered(
            destruction_list, self.request.user
        )

        if destruction_list.processing_status == InternalStatus.new:
            destruction_list.planned_destruction_date = today + timedelta(
                days=settings.WAITING_PERIOD
            )
            destruction_list.save()
            return Response()

        # If it is a retry, process immediately
        delete_destruction_list(destruction_list)
        return Response()

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

    @action(detail=True, methods=["post"], name="mark-ready-review")
    def mark_ready_review(self, request, *args, **kwargs):
        destruction_list = self.get_object()

        destruction_list.assign_next()

        logevent.destruction_list_ready_for_first_review(destruction_list, request.user)

        return Response(status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], name="abort")
    def abort(self, request, *args, **kwargs):
        """
        "Abort" destruction list:
        - Sets the status of the destruction list to "new"
        - Cancels if the destruction list is due to be destroyed.
        """
        destruction_list = self.get_object()

        serializer = AbortDestructionSerializer(
            data=request.data, instance=destruction_list, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response()

    @action(detail=True, methods=["get"], name="download_report")
    def download_report(self, request, *args, **kwargs):
        destruction_list = self.get_object()

        # Get the URL of the document in Openzaak.
        document_url = destruction_list.get_destruction_report_url()
        if not document_url:
            raise NotFound(_("No destruction report found for this destruction list"))

        service = Service.get_service(document_url)
        client = build_client(service)
        with client:
            try:
                response = client.get(
                    document_url, timeout=settings.REQUESTS_DEFAULT_TIMEOUT, stream=True
                )
            except ConnectionError:
                return Response(
                    {"detail": _("Could not connect to Open Zaak.")}, status=502
                )

            if response.status_code == 404:
                raise NotFound(
                    _("The requested report could not be found in Open Zaak.")
                )

            try:
                response.raise_for_status()
            except HTTPError:
                return Response(
                    {"detail": _("Error response received from Open Zaak.")}, status=502
                )

            try:
                response = StreamingHttpResponse(
                    response.iter_content(),
                    content_type="application/vnd.ms-excel",
                )
                response["Content-Disposition"] = (
                    f'attachment; filename="report_{slugify(destruction_list.name)}.xlsx"'
                )
                return response
            except Timeout:
                return Response({"detail": _("Open Zaak timed out.")}, status=504)
            except RequestException:
                return Response(
                    {"detail": _("Open Zaak errored while retrieving the report.")},
                    status=502,
                )


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
    filter_backends = (NestedFilterBackend, NestedOrderingFilterBackend)
    filterset_class = DestructionListItemFilterset
    filterset_kwargs = {"prefix": "item"}
    nested_filterset_class = ZaakFilterSet
    nested_filterset_relation_field = "zaak"
    pagination_class = PageNumberPagination
    ordering_fields = "__all__"
    nested_ordering_fields = "__all__"
    nested_ordering_model = Zaak
    nested_ordering_relation_field = "zaak"
    nested_ordering_prefix = "item"

    def get_queryset(self):
        review_response_items = ReviewItemResponse.objects.filter(
            review_item__destruction_list_item=OuterRef("pk")
        ).order_by("-created")

        qs = (
            DestructionListItem.objects.all()
            .select_related("zaak")
            .annotate(
                last_review_response_action_item=Subquery(
                    review_response_items.values("action_item")[:1]
                )
            )
            .annotate(
                review_advice_ignored=Case(
                    When(
                        ~Q(destruction_list__status=ListStatus.ready_to_review),
                        then=Value(None),
                    ),
                    When(
                        last_review_response_action_item=DestructionListItemAction.keep,
                        then=Value(True),
                    ),
                    When(
                        last_review_response_action_item=DestructionListItemAction.remove,
                        then=Value(False),
                    ),
                    When(
                        last_review_response_action_item__isnull=True, then=Value(None)
                    ),
                )
            )
        )
        return qs


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
    DestructionListChecksMixin,
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
        tags=["Co-Reviews"],
        summary=_("List co-reviews"),
        description=_(
            "List all the co-reviews that have been made for a destruction list."
        ),
    ),
    create=extend_schema(
        tags=["Co-Reviews"],
        summary=_("Create co-review"),
        description=_(
            "Create a co-review for a destruction list. "
            "Only a user currently assigned as co-reviewer to the destruction list can create a review."
        ),
    ),
)
class DestructionListCoReviewViewSet(
    DestructionListChecksMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DestructionListCoReviewSerializer
    queryset = DestructionListCoReview.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DestructionListCoReviewFilterset

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated & CanCoReviewPermission]
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
    filter_backends = (NestedFilterBackend, NestedOrderingFilterBackend)
    filterset_kwargs = {"prefix": "item-review"}
    nested_filterset_class = ZaakFilterSet
    nested_filterset_relation_field = "destruction_list_item__zaak"
    ordering_fields = "__all__"
    nested_ordering_fields = "__all__"
    nested_ordering_model = Zaak
    nested_ordering_relation_field = "destruction_list_item__zaak"
    nested_ordering_prefix = "item-review"


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
        request=CoReviewerAssignmentSerializer,
        responses={200: DestructionListAssigneeReadSerializer},
    ),
    partial_update=extend_schema(
        tags=["Destruction list"],
        summary=_("Partial update co-reviewers"),
        description=_(
            "Partial update of the co-reviewers assigned to a destruction list."
        ),
        request=CoReviewerAssignmentSerializer,
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
                return CoReviewerAssignmentSerializer
            case default:  # noqa
                return DestructionListAssigneeReadSerializer

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
