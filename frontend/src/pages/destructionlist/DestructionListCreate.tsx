import {
  AttributeData,
  DataGridProps,
  ListTemplate,
  TypedField,
} from "@maykin-ui/admin-ui";
import React from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

import { loginRequired } from "../../lib/api/loginRequired";
import { ZaaktypeChoice, listZaaktypeChoices } from "../../lib/api/private";
import { PaginatedZaken, listZaken } from "../../lib/api/zaken";
import {
  addToZaakSelection,
  isZaakSelected,
  removeFromZaakSelection,
} from "../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../types";
import "./DestructionListCreate.css";

/** We need a key to store the zaak selection to, however we don't have a destruction list name yet. */
const DESTRUCTION_LIST_CREATE_KEY = "tempDestructionList";

export type DestructionListCreateContext = {
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  zaaktypeChoices: ZaaktypeChoice[];
};

/**
 * React Router loader.
 * @param request
 */
export const destructionListCreateLoader = loginRequired(
  async ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    searchParams.set("not_in_destruction_list", "true");

    // Get zaken and zaaktypen.
    const zaken = await listZaken(searchParams);
    const zaaktypeChoices = await listZaaktypeChoices();

    // Get zaak selection.
    const isZaakSelectedPromises = zaken.results.map((zaak) =>
      isZaakSelected(DESTRUCTION_LIST_CREATE_KEY, zaak),
    );
    const isZaakSelectedResults = await Promise.all(isZaakSelectedPromises);
    const selectedZaken = zaken.results.filter(
      (_, index) => isZaakSelectedResults[index],
    );

    return { zaken, selectedZaken, zaaktypeChoices };
  },
);

export type DestructionListCreateProps = Omit<
  React.ComponentProps<"main">,
  "onChange" | "onSelect"
>;

/**
 * Destruction list creation page
 */
export function DestructionListCreatePage({
  ...props
}: DestructionListCreateProps) {
  const { zaken, selectedZaken, zaaktypeChoices } =
    useLoaderData() as DestructionListCreateContext;
  const [searchParams, setSearchParams] = useSearchParams();
  const objectList = zaken.results as unknown as AttributeData[];
  const { state } = useNavigation();

  const fields: TypedField[] = [
    {
      name: "identificatie",
      filterLookup: "identificatie__icontains",
      filterValue: searchParams.get("identificatie__icontains") || "",
      type: "string",
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
      name: "looptijd",
      filterable: false,
      valueTransform: (rowData) => {
        const zaak = rowData as unknown as Zaak;
        const startDate = new Date(zaak.startdatum);
        const endDate = zaak.einddatum ? new Date(zaak.einddatum) : new Date();
        return (
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + " dagen"
        );
      },
      type: "string",
    },
    {
      name: "resultaattype",
      filterLookup: "resultaat__resultaattype__omschrijving__icontains",
      filterValue:
        searchParams.get("resultaat__resultaattype__omschrijving__icontains") ||
        "",
      valueLookup: "_expand.resultaat._expand.resultaattype.omschrijving",
      type: "string",
    },
    {
      name: "bewaartermijn",
      filterLookup: "resultaat__resultaattype__archiefactietermijn__icontains",
      filterValue:
        searchParams.get(
          "resultaat__resultaattype__archiefactietermijn__icontains",
        ) || "",
      valueLookup:
        "_expand.resultaat._expand.resultaattype.archiefactietermijn",
      type: "string",
    },
    {
      name: "vcs",
      filterLookup: "zaaktype__selectielijstprocestype__naam__icontains",
      filterValue:
        searchParams.get(
          "zaaktype__selectielijstprocestype__naam__icontains",
        ) || "",
      valueLookup: "_expand.zaaktype.selectielijstProcestype.naam",
      type: "string",
    },
    {
      name: "relaties",
      filterLookup: "heeft_relaties",
      valueTransform: (rowData) =>
        Boolean((rowData as unknown as Zaak)?.relevanteAndereZaken?.length),
      filterValue: searchParams.get("heeft_relaties") || "",
      type: "boolean",
      options: [
        { value: "true", label: "Ja" },
        { value: "false", label: "Nee" },
      ],
    },
  ];

  /**
   * Gets called when a filter value is change.
   * @param filterData
   */
  const onFilter = (filterData: AttributeData<string>) => {
    const combinedParams = {
      ...Object.fromEntries(searchParams),
      ...filterData,
    };

    const activeParams = Object.fromEntries(
      Object.entries(combinedParams).filter(([k, v]) => v),
    );

    setSearchParams(activeParams);
  };

  /**
   * Gets called when the selection is changed.
   * @param attributeData
   * @param selected
   */
  const onSelect = async (
    attributeData: AttributeData[],
    selected: boolean,
  ) => {
    selected
      ? await addToZaakSelection(
          DESTRUCTION_LIST_CREATE_KEY,
          attributeData as unknown as Zaak[],
        )
      : await removeFromZaakSelection(
          DESTRUCTION_LIST_CREATE_KEY,
          attributeData.length
            ? (attributeData as unknown as Zaak[])
            : zaken.results,
        );
  };

  return (
    <ListTemplate
      dataGridProps={
        {
          count: zaken.count,
          fields: fields,
          loading: state === "loading",
          objectList: objectList,
          pageSize: 100,
          showPaginator: true,
          selectable: true,
          selected: selectedZaken as unknown as AttributeData[],
          labelSelect: `Zaak {identificatie} toevoegen aan selectie`,
          labelSelectAll:
            "Alle {count} zaken op deze pagina toevoegen aan selectie",
          title: "Vernietigingslijst starten",
          boolProps: {
            explicit: true,
          },
          filterable: true,
          page: Number(searchParams.get("page")) || 1,
          onFilter: onFilter,
          onSelect: onSelect,
          onPageChange: (page) =>
            setSearchParams({
              ...Object.fromEntries(searchParams),
              page: String(page),
            }),
        } as DataGridProps
      }
      {...props}
    />
  );
}
