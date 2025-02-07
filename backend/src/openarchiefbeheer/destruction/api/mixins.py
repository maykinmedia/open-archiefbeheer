from django.utils.translation import gettext_lazy as _

from rest_framework.exceptions import ValidationError

from ..models import DestructionList


class DestructionListChecksMixin:
    """Check the permissions on a destruction list

    Used by APIView endpoints that create a resource related to a destruction list (for example a review/co-review)
    and need to check based on the rights of the user, the status and the assignees of the destruction list
    whether the action is allowed.
    """

    def create(self, request, *args, **kwargs):
        try:
            destruction_list = DestructionList.objects.get(
                uuid=request.data.get("destruction_list")
            )
        except DestructionList.DoesNotExist:
            raise ValidationError(
                detail={"destruction_list": _("The destruction list does not exist.")}
            )

        self.check_object_permissions(self.request, destruction_list)
        return super().create(request, *args, **kwargs)
