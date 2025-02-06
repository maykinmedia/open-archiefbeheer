from django.utils.translation import gettext_lazy as _

from rest_framework.exceptions import ValidationError
from rest_framework.request import Request

from ..models import DestructionList


class DestructionListChecksMixin:
    def get_destruction_list(self, request: Request) -> DestructionList:
        try:
            return DestructionList.objects.get(
                uuid=request.data.get("destruction_list")
            )
        except DestructionList.DoesNotExist:
            raise ValidationError(
                detail={"destruction_list": _("The destruction list does not exist.")}
            )

    def check_destruction_list_permissions(self, request: Request) -> None:
        destruction_list = self.get_destruction_list(request)
        self.check_object_permissions(self.request, destruction_list)

    def create(self, request, *args, **kwargs):
        self.check_destruction_list_permissions(request)
        return super().create(request, *args, **kwargs)
