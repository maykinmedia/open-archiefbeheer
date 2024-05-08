from django.db import transaction
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import DestructionList
from .permissions import CanStartDestructionPermission
from .serializers import DestructionListSerializer


@extend_schema_view(
    list=extend_schema(
        summary=_("List destruction lists"),
        description=_("List all destruction lists."),
    ),
    create=extend_schema(
        summary=_("Create destruction list"),
        description=_("Create a new destruction list."),
        examples=[
            OpenApiExample(
                name="Example list creation",
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
)
class DestructionListViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    serializer_class = DestructionListSerializer
    queryset = DestructionList.objects.all()

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated & CanStartDestructionPermission]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
