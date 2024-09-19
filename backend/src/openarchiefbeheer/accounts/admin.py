from django.contrib import admin
from django.contrib.admin.utils import unquote
from django.contrib.auth.admin import UserAdmin as _UserAdmin
from django.core.exceptions import PermissionDenied, ValidationError
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

from .forms import PreventPrivilegeEscalationMixin, UserChangeForm
from .models import Role, User
from .utils import validate_max_user_permissions


@admin.register(User)
class UserAdmin(_UserAdmin):
    hijack_success_url = reverse_lazy("root")
    form = UserChangeForm
    list_display = _UserAdmin.list_display + ("role",)

    def get_form(self, request, obj=None, **kwargs):
        ModelForm = super().get_form(request, obj, **kwargs)
        assert issubclass(ModelForm, (PreventPrivilegeEscalationMixin, self.add_form))
        # Set the current and target user on the ModelForm class so they are
        # available in the instantiated form. See the comment in the
        # UserChangeForm for more details.
        ModelForm._current_user = request.user
        ModelForm._target_user = obj
        return ModelForm

    def user_change_password(self, request, id, form_url=""):
        user = self.get_object(request, unquote(id))
        try:
            validate_max_user_permissions(request.user, user)
        except ValidationError as exc:
            raise PermissionDenied from exc

        return super().user_change_password(request, id, form_url)

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        return tuple(fieldsets) + ((_("Role"), {"fields": ("role",)}),)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "can_start_destruction",
        "can_review_destruction",
        "can_view_case_details",
        "can_review_final_list",
    )
