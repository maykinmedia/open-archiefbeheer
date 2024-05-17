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
import { Zaak } from "../../types";
import "./DestructionListCreate.css";

export type DestructionListCreateContext = {
  zaken: PaginatedZaken;
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
    const zaken = await listZaken(searchParams);
    const zaaktypeChoices = await listZaaktypeChoices();
    return { zaken, zaaktypeChoices };
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
  const { zaken, zaaktypeChoices } =
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

  const onFilter = (filterData: AttributeData<string>) => {
    // TODO: Fill filter fields with current value
    const combinedParams = {
      ...Object.fromEntries(searchParams),
      ...filterData,
    };

    const activeParams = Object.fromEntries(
      Object.entries(combinedParams).filter(([k, v]) => v),
    );

    setSearchParams(activeParams);
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
          selectable: false, // TODO
          title: "Vernietigingslijst starten",
          boolProps: {
            explicit: true,
          },
          filterable: true,
          page: Number(searchParams.get("page")) || 1,
          onFilter: onFilter,
          /*
          TODO: Multi page selection flow

          We should keep track of both selected and unselected zaken across multiple pages using onSelect (second
          parameter indicates selection state). We should store every (un)selected item somewhere (sessionStorage?).

          When submitting data we consider both the state for selected and unselected zaken as mutations to the
          destruction list items. The zaken not in any of the selection should be left untouched (by both the backend
          and the frontend). Submitting data only pushes the changes to the backend state.
           */
          // selectionActions: [
          //   {
          //     children: "Aanmaken",
          //     onClick: (...args) => console.log(...args),
          //   },
          // ],
          // TODO: Keep track of selected/unselected state.
          onSelectionChange: (...args) =>
            console.log("onSelectionChange", args),
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
