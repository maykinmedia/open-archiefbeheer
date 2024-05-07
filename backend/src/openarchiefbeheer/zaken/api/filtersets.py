from django.db.models import Q, QuerySet, Subquery
from django.utils.translation import gettext_lazy as _

from django_filters import BooleanFilter, FilterSet

from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.models import DestructionListItem

from ..models import Zaak


class ZaakFilter(FilterSet):
    not_in_destruction_list = BooleanFilter(
        field_name="not_in_destruction_list",
        method="filter_not_in_destruction_list",
        help_text=_(
            "If True, only cases not already included in a destruction list are returned."
        ),
    )

    class Meta:
        model = Zaak
        fields = {
            "uuid": ["exact"],
            "url": ["exact"],
            "status": ["exact"],
            "zaaktype": ["exact", "in"],
            "einddatum": ["exact", "gt", "lt", "isnull"],
            "hoofdzaak": ["exact"],
            "resultaat": ["exact"],
            "startdatum": ["exact", "gt", "lt", "gte", "lte"],
            "toelichting": ["exact"],
            "omschrijving": ["exact"],
            "archiefstatus": ["exact", "in"],
            "identificatie": ["exact"],
            "bronorganisatie": ["exact", "in"],
            "publicatiedatum": ["exact"],
            "archiefnominatie": ["exact", "in"],
            "einddatum_gepland": ["exact", "gt", "lt"],
            "registratiedatum": ["exact", "gt", "lt"],
            "archiefactiedatum": ["exact", "gt", "lt", "isnull"],
            "processobjectaard": ["exact"],
            "betalingsindicatie": ["exact"],
            "communicatiekanaal": ["exact"],
            "laatste_betaaldatum": ["exact"],
            "selectielijstklasse": ["exact"],
            "startdatum_bewaartermijn": ["exact"],
            "betalingsindicatie_weergave": ["exact"],
            "opdrachtgevende_organisatie": ["exact"],
            "vertrouwelijkheidaanduiding": ["exact"],
            "uiterlijke_einddatum_afdoening": ["exact", "gt", "lt"],
            "verantwoordelijke_organisatie": ["exact"],
            # TODO Decide what to do with these fields and if/how we want to filter them
            # # Array Fields
            # "rollen": ["exact"],
            # "deelzaken": ["exact"],
            # "zaakobjecten": ["exact"],
            # "eigenschappen": ["exact"],
            # "producten_of_diensten": ["exact"],
            # "zaakinformatieobjecten": ["exact"],
            # # JSON Fields
            # "kenmerken": ["exact"],
            # "verlenging": ["exact"],
            # "opschorting": ["exact"],
            # "processobject": ["exact"],
            # "relevante_andere_zaken": ["exact"],
            # # Geometry Field
            # "zaakgeometrie": ["exact"],
        }

    def filter_not_in_destruction_list(
        self, queryset: QuerySet[Zaak], name: str, value: bool
    ) -> QuerySet[Zaak]:
        if not value:
            return queryset

        zaken_to_exclude = DestructionListItem.objects.filter(
            ~Q(status=ListItemStatus.removed)
        ).values_list("zaak", flat=True)

        return queryset.exclude(url__in=Subquery(zaken_to_exclude))
