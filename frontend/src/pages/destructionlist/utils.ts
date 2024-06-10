import { AttributeData, TypedField } from "@maykin-ui/admin-ui";

import { ZaaktypeChoice } from "../../lib/api/private";
import { User } from "../../lib/api/reviewers";
import {
  addToZaakSelection,
  removeFromZaakSelection,
} from "../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../types";

export function getFields(
  searchParams: URLSearchParams,
  zaaktypeChoices: ZaaktypeChoice[],
): TypedField[] {
  return [
    {
      name: "identificatie",
      filterLookup: "identificatie__icontains",
      filterValue: searchParams.get("identificatie__icontains") || "",
      type: "string",
    },
    {
      name: "archiefnominatie",
      type: "string",
      options: [
        { label: "Blijvend bewaren", value: "blijvend_bewaren" },
        { label: "Vernietigen", value: "vernietigen" },
      ],
    },
    {
      name: "resultaat",
      filterLookup: "resultaat__resultaattype__omschrijving__icontains",
      filterValue:
        searchParams.get("resultaat__resultaattype__omschrijving__icontains") ||
        "",
      valueLookup: "_expand.resultaat._expand.resultaattype.omschrijving",
      type: "string",
    },
    {
      name: "startdatum",
      type: "daterange",
    },
    {
      name: "einddatum",
      type: "daterange",
    },
    {
      name: "zaaktype",
      filterLookup: "zaaktype",
      filterValue: searchParams.get("zaaktype") || "",
      valueLookup: "_expand.zaaktype.omschrijving",
      options: zaaktypeChoices,
      type: "string",
    },
    {
      name: "omschrijving",
      filterLookup: "omschrijving__icontains",
      filterValue: searchParams.get("omschrijving__icontains") || "",
      type: "string",
    },
    {
      active: false,
      name: "toelichting",
      type: "string",
      filterLookup: "toelichting__icontains",
    },
    // TODO
    // {
    //   name: "Behandelend afdeling"
    // },
    {
      name: "archiefactiedatum",
      type: "string", // TODO: Support date(range)
    },
    {
      active: false,
      name: "selectielijstklasse",
      type: "string",
      // filterLookup: // TODO: Expand?
    },
    {
      name: "hoofdzaak",
      type: "string",
      // valueLookup: // TODO: Expand?
    },
    {
      active: false,
      name: "relaties",
      filterLookup: "heeft_relaties",
      valueTransform: (rowData: object) =>
        Boolean((rowData as Zaak)?.relevanteAndereZaken?.length),
      filterValue: searchParams.get("heeft_relaties") || "",
      type: "boolean",
      options: [
        { value: "true", label: "Ja" },
        { value: "false", label: "Nee" },
      ],
    },
  ];
}

export async function updateSelectedZaken(
  selected: boolean,
  attributeData: AttributeData[],
  destructionListKey: string,
  zaken: Zaak[],
) {
  selected
    ? await addToZaakSelection(
        destructionListKey,
        attributeData as unknown as Zaak[],
      )
    : await removeFromZaakSelection(
        destructionListKey,
        attributeData.length ? (attributeData as unknown as Zaak[]) : zaken,
      );
}

export function formatUser(user: User) {
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName} (${user.username})`;
  return user.username;
}
