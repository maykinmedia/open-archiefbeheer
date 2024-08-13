from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Prefetch
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

from ..constants import InternalStatus, ListRole
from ..models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewResponse,
)
from ..tasks import delete_destruction_list
from ..utils import process_new_assignees
from .filtersets import (
    DestructionListFilterset,
    DestructionListItemFilterset,
    DestructionListReviewFilterset,
    DestructionListReviewItemFilterset,
    ReviewResponseFilterset,
)
from .permissions import (
    CanMarkListAsFinal,
    CanReassignDestructionList,
    CanReviewPermission,
    CanStartDestructionPermission,
    CanTriggerDeletion,
    CanUpdateDestructionList,
)
from .serializers import (
    AuditTrailItemSerializer,
    DestructionListAPIResponseSerializer,
    DestructionListAssigneeSerializer,
    DestructionListItemReviewSerializer,
    DestructionListItemSerializer,
    DestructionListReviewSerializer,
    DestructionListSerializer,
    ReassignementSerializer,
    ReviewerAssigneeSerializer,
    ReviewResponseSerializer,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Destruction list"],
        summary=_("List destruction lists"),
        description=_("List all destruction lists."),
        responses={200: DestructionListAPIResponseSerializer(many=True)},
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
                    "items": [
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
                name="Example list update",
                request_only=True,
                value={
                    "name": "An example updated list",
                    "containsSensitiveInfo": False,
                    "items": [
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
        responses={200: DestructionListAPIResponseSerializer},
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
)
class DestructionListViewSet(
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DestructionListSerializer
    queryset = (
        DestructionList.objects.all()
        .select_related("author", "author__role", "assignee", "assignee__role")
        .prefetch_related(
            Prefetch(
                "assignees",
                queryset=DestructionListAssignee.objects.select_related(
                    "user", "user__role"
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
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ["retrieve", "list"]:
            return DestructionListAPIResponseSerializer
        return self.serializer_class

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance: DestructionList) -> None:
        instance.processing_status = InternalStatus.queued
        instance.save()

        delete_destruction_list(instance)

    @action(detail=True, methods=["post"], name="make-final")
    def make_final(self, request, *args, **kwargs):
        destruction_list = self.get_object()

        serialiser = DestructionListAssigneeSerializer(
            data={
                "destruction_list": destruction_list.pk,
                "role": ListRole.archivist,
                **request.data,
            }
        )
        serialiser.is_valid(raise_exception=True)

        if not serialiser.validated_data["user"].role.can_review_final_list:
            raise ValidationError(
                {
                    "user": _(
                        "The chosen user does not have the permission to review a final list."
                    )
                }
            )

        serialiser.save()
        destruction_list.assign_next()

        return Response(status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], name="reassign")
    def reassign(self, request, *args, **kwargs):
        destruction_list = self.get_object()
        serialiser = ReassignementSerializer(
            data=request.data,
            context={"destruction_list": destruction_list, "request": request},
        )
        serialiser.is_valid(raise_exception=True)

        new_assignees = process_new_assignees(
            destruction_list,
            serialiser.validated_data["assignees"],
            serialiser.validated_data["role"],
        )
        destruction_list.reassign()

        logevent.destruction_list_reassigned(
            destruction_list,
            new_assignees,
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
    serializer_class = DestructionListItemSerializer
    queryset = DestructionListItem.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DestructionListItemFilterset
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
    queryset = DestructionListItemReview.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DestructionListReviewItemFilterset


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
