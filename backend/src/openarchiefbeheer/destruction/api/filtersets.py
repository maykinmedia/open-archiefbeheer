from django_filters import FilterSet, NumberFilter

from ..models import DestructionList, DestructionListItem


class DestructionListItemFilterset(FilterSet):
    class Meta:
        model = DestructionListItem
        fields = ("destruction_list",)


class DestructionListFilterset(FilterSet):
    assignee = NumberFilter(
        field_name="assignee",
        help_text="The pk of the user currently assigned to the list.",
    )

    class Meta:
        model = DestructionList
        fields = ("assignee",)
