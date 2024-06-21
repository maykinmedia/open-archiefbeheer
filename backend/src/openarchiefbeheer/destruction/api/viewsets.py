from django.db import transaction
from django.utils.translation import gettext_lazy as _

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import (
    DestructionList,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewResponse,
)
from .filtersets import (
    DestructionListFilterset,
    DestructionListItemFilterset,
    DestructionListReviewFilterset,
    DestructionListReviewItemFilterset,
    ReviewResponseFilterset,
)
from .permissions import CanStartDestructionPermission, CanUpdateDestructionList
from .serializers import (
    DestructionListAPIResponseSerializer,
    DestructionListItemReviewSerializer,
    DestructionListItemSerializer,
    DestructionListReviewSerializer,
    DestructionListSerializer,
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
                        {"user": 1, "order": 0},
                        {"user": 2, "order": 1},
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
            "The cases and the assignees are updated in bulk."
        ),
        examples=[
            OpenApiExample(
                name="Example list update",
                request_only=True,
                value={
                    "name": "An example updated list",
                    "containsSensitiveInfo": False,
                    "assignees": [
                        {"user": 2, "order": 0},
                        {"user": 1, "order": 1},
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
    partial_update=extend_schema(
        tags=["Destruction list"],
        summary=_("Partially update a destruction list"),
        description=_(
            "Partially update a destruction list. "
            "The cases and the assignees are updated in bulk."
        ),
        examples=[
            OpenApiExample(
                name="Example list partial update",
                value={
                    "name": "Partially updated list",
                    "assignees": [
                        {"user": 2, "order": 0},
                        {"user": 1, "order": 1},
                    ],
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
)
class DestructionListViewSet(
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DestructionListSerializer
    queryset = DestructionList.objects.all()
    lookup_field = "uuid"
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DestructionListFilterset

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated & CanStartDestructionPermission]
        elif self.action == "update":
            permission_classes = [IsAuthenticated & CanUpdateDestructionList]
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
