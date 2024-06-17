from decimal import Decimal

from django.db.models import (
    Case,
    CharField,
    F,
    Func,
    IntegerField,
    Q,
    QuerySet,
    Subquery,
    Value,
    When,
)
from django.utils.translation import gettext_lazy as _

from django_filters import (
    BooleanFilter,
    CharFilter,
    FilterSet,
    NumberFilter,
    UUIDFilter,
)

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
    in_destruction_list = UUIDFilter(
        field_name="in_destruction_list",
        method="filter_in_destruction_list",
        help_text=_("All cases included in a destruction list are returned."),
    )
    not_in_destruction_list_except = UUIDFilter(
        field_name="not_in_destruction_list_except",
        method="filter_not_in_destruction_list_except",
        help_text=_(
            "Only cases not already included in a destruction list except the one specified are returned. "
            "The cases that are included in the 'exception' list are returned first."
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

    behandelend_afdeling__icontains = CharFilter(
        field_name="behandelend_afdeling__icontains",
        method="filter_behandelend_afdeling",
        help_text="The 'behandelend afdeling' is the 'betrokkeneIdentificatie.identificatie' field of the roles related to the case which have betrokkeneType = organisatorische_eenheid.",
    )

    class Meta:
        model = Zaak
        fields = {
            "uuid": ["exact", "icontains"],
            "url": ["exact", "icontains"],
            "status": ["exact", "icontains"],
            "einddatum": ["exact", "gt", "lt", "gte", "lte", "isnull"],
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
            "archiefactiedatum": ["exact", "gt", "lt", "gte", "lte", "isnull"],
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

    def filter_in_destruction_list(
        self, queryset: QuerySet[Zaak], name: str, value: str
    ) -> QuerySet[Zaak]:
        list_items = DestructionListItem.objects.filter(
            Q(destruction_list__uuid=value) & ~Q(status=ListItemStatus.removed)
        ).values_list("zaak", flat=True)
        return queryset.filter(url__in=Subquery(list_items))

    def filter_not_in_destruction_list_except(
        self, queryset: QuerySet[Zaak], name: str, value: str
    ) -> QuerySet[Zaak]:
        zaken_to_exclude = DestructionListItem.objects.filter(
            ~Q(status=ListItemStatus.removed) & ~Q(destruction_list__uuid=value)
        ).values_list("zaak", flat=True)

        exception_list = DestructionListItem.objects.filter(
            destruction_list__uuid=value
        ).values_list("zaak", flat=True)

        return (
            queryset.exclude(url__in=Subquery(zaken_to_exclude))
            .annotate(
                in_exception_list=Case(
                    When(url__in=Subquery(exception_list), then=Value(True))
                )
            )
            .order_by("in_exception_list")
        )

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

    def filter_behandelend_afdeling(
        self, queryset: QuerySet[Zaak], name: str, value: str
    ) -> QuerySet[Zaak]:
        zaken_with_afdeling = queryset.filter(
            _expand__rollen__contains=[
                {
                    "betrokkene_type": "organisatorische_eenheid",
                }
            ]
        )
        json_path_expression = '$.rollen[*] ? (@.betrokkene_type == "organisatorische_eenheid").betrokkene_identificatie.identificatie'
        zaken_with_afdeling = zaken_with_afdeling.annotate(
            behandelend_afdeling=Func(
                F("_expand"),
                Value(json_path_expression),
                function="jsonb_path_query_array",
                output_field=CharField(),
            )
        )

        return zaken_with_afdeling.filter(behandelend_afdeling__contains=value)
