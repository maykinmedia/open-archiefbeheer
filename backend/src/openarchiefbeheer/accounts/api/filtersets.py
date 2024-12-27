from django.db.models import QuerySet

from django_filters import ChoiceFilter, FilterSet

from ..models import User
from .constants import RoleFilterChoices


class UsersFilterset(FilterSet):
    role = ChoiceFilter(
        field_name="role",
        method="filter_role",
        help_text="Filter on the user's role.",
        choices=RoleFilterChoices.choices,
    )

    class Meta:
        model = User
        fields = ("role",)

    def filter_role(
        self, queryset: QuerySet[User], name: str, value: str
    ) -> QuerySet[User]:
        match value:
            case RoleFilterChoices.record_manager:
                return User.objects.record_managers()
            case RoleFilterChoices.main_reviewer:
                return User.objects.main_reviewers()
            case RoleFilterChoices.co_reviewer:
                return User.objects.co_reviewers()
            case RoleFilterChoices.archivist:
                return User.objects.archivists()
            case _:
                return queryset
