from decimal import Decimal

from django.db.models import Func, IntegerField, Q, QuerySet, Subquery
from django.utils.translation import gettext_lazy as _

from django_filters import BooleanFilter, CharFilter, FilterSet, NumberFilter

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
    _expand__resultaat__resultaattype = CharFilter(
        help_text=_("Filter on the exact URL of resultaattype."),
    )
    bewaartermijn = CharFilter(
        field_name="bewaartermijn",
        method="filter_bewaartermijn",
        help_text=_(
            "Filter on bewaartermijn. "
            "This corresponds to the property 'resultaat.resultaattype.archiefactietermijn'. "
            "This field is expressed in Open Zaak as a ISO8601 duration."
        ),
    )
    vcs = NumberFilter(
        field_name="vcs",
        method="filter_vcs",
        help_text=_(
            "Filter on VCS. This stands for 'Vernietigings-Categorie Selectielijst'. "
            "It is obtained through 'zaaktype.procestype.nummer'."
        ),
        decimal_places=0,
    )
    heeft_relaties = BooleanFilter(
        field_name="heeft_relaties",
        method="filter_heeft_relaties",
        help_text=_(
            "Filter on whether this case has other related cases. "
            "This is done by looking at the property 'relevanteAndereZaken'."
        ),
    )

    # Expand lookups

    zaaktype__omschrijving__icontains = CharFilter(
        field_name="_expand__zaaktype__omschrijving", lookup_expr="icontains"
    )

    resultaat__resultaattype__omschrijving__icontains = CharFilter(
        field_name="_expand__resultaat___expand__resultaattype__omschrijving",
        lookup_expr="icontains",
    )

    resultaat__resultaattype__archiefactietermijn__icontains = CharFilter(
        field_name="_expand__resultaat___expand__resultaattype__archiefactietermijn",
        lookup_expr="icontains",
    )

    zaaktype__selectielijstprocestype__naam__icontains = CharFilter(
        field_name="_expand__zaaktype__selectielijst_procestype__naam",
        lookup_expr="icontains",
    )

    class Meta:
        model = Zaak
        fields = {
            "uuid": ["exact", "icontains"],
            "url": ["exact", "icontains"],
            "status": ["exact", "icontains"],
            "einddatum": ["exact", "gt", "lt", "isnull"],
            "hoofdzaak": ["exact", "icontains"],
            "startdatum": ["exact", "gt", "lt", "gte", "lte"],
            "toelichting": ["exact", "icontains"],
            "omschrijving": ["exact", "icontains"],
            "archiefstatus": ["exact", "in", "icontains"],
            "identificatie": ["exact", "icontains"],
            "bronorganisatie": ["exact", "in", "icontains"],
            "publicatiedatum": ["exact", "icontains"],
            "archiefnominatie": ["exact", "in", "icontains"],
            "einddatum_gepland": ["exact", "gt", "lt"],
            "registratiedatum": ["exact", "gt", "lt"],
            "archiefactiedatum": ["exact", "gt", "lt", "isnull"],
            "processobjectaard": ["exact", "icontains"],
            "betalingsindicatie": ["exact", "icontains"],
            "communicatiekanaal": ["exact", "icontains"],
            "laatste_betaaldatum": ["exact", "icontains"],
            "selectielijstklasse": ["exact", "icontains"],
            "startdatum_bewaartermijn": ["exact", "icontains"],
            "betalingsindicatie_weergave": ["exact", "icontains"],
            "opdrachtgevende_organisatie": ["exact", "icontains"],
            "vertrouwelijkheidaanduiding": ["exact", "icontains"],
            "uiterlijke_einddatum_afdoening": ["exact", "gt", "lt"],
            "verantwoordelijke_organisatie": ["exact", "icontains"],
            "zaaktype": ["exact", "icontains"],
            # TODO Decide what to do with these fields and if/how we want to filter them
            # # Array Fields
            # "rollen": ["exact", "icontains"],
            # "deelzaken": ["exact", "icontains"],
            # "zaakobjecten": ["exact", "icontains"],
            # "eigenschappen": ["exact", "icontains"],
            # "producten_of_diensten": ["exact", "icontains"],
            # "zaakinformatieobjecten": ["exact", "icontains"],
            # # JSON Fields
            # "kenmerken": ["exact", "icontains"],
            # "verlenging": ["exact", "icontains"],
            # "opschorting": ["exact", "icontains"],
            # "processobject": ["exact", "icontains"],
            # # Geometry Field
            # "zaakgeometrie": ["exact", "icontains"],
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

    def filter_bewaartermijn(
        self, queryset: QuerySet[Zaak], name: str, value: str
    ) -> QuerySet[Zaak]:
        # TODO it would be nice to do comparisons for periods such as gt/lt
        return queryset.filter(
            _expand__resultaat___expand__resultaattype__archiefactietermijn=value
        )

    def filter_vcs(
        self, queryset: QuerySet[Zaak], name: str, value: Decimal
    ) -> QuerySet[Zaak]:
        return queryset.filter(
            _expand__zaaktype__selectielijst_procestype__nummer=int(value)
        )

    def filter_heeft_relaties(
        self, queryset: QuerySet[Zaak], name: str, value: bool
    ) -> QuerySet[Zaak]:
        annotated_zaken = queryset.annotate(
            number_relations=Func(
                "relevante_andere_zaken",
                function="jsonb_array_length",
                output_field=IntegerField(),
            )
        )
        if value:
            return annotated_zaken.filter(number_relations__gt=0)

        return annotated_zaken.filter(number_relations=0)
