from django.db import transaction

from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import DestructionList
from .permissions import CanStartDestructionPermission
from .serializers import DestructionListSerializer


class DestructionListViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
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
        # TODO log creation
        return super().create(request, *args, **kwargs)
