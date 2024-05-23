from django_filters import FilterSet

from ..models import DestructionListItem


class DestructionListItemFilterset(FilterSet):
    class Meta:
        model = DestructionListItem
        fields = ("destruction_list",)
