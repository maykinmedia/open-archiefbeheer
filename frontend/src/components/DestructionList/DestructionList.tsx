import {
  AttributeData,
  DataGridProps,
  ListTemplate,
  TypedField,
} from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";
import {
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

import { ZaaktypeChoice } from "../../lib/api/private";
import { PaginatedZaken } from "../../lib/api/zaken";
import {
  FieldSelection,
  getFieldSelection,
} from "../../lib/fieldSelection/fieldSelection";
import {
  addToZaakSelection,
  removeFromZaakSelection,
} from "../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../types";

export type DestructionList = {
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  onSubmitSelection: () => void;
  zaaktypeChoices: ZaaktypeChoice[];
  // TODO: Here we could implement a simple API to specifiy what fields to show in the list.
  destructionListCreateKey: string;
  title: string;
};

/**
 * Review-destruction-list page
 */
export function DestructionList({
  zaken,
  onSubmitSelection,
  selectedZaken,
  zaaktypeChoices,
  destructionListCreateKey,
  title,
}: DestructionList) {
  const errors = useActionData() || {};

  const [searchParams, setSearchParams] = useSearchParams();
  const objectList = zaken.results as unknown as AttributeData[];
  const { state } = useNavigation();

  const [fieldSelectionState, setFieldSelectionState] =
    useState<FieldSelection>();

  useEffect(() => {
    getFieldSelection(destructionListCreateKey).then((fieldSelection) =>
      setFieldSelectionState(fieldSelection),
    );
  }, []);

  const fields: TypedField[] = [
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
      type: "string", // TODO: Support date(range)
      filterable: false, // TODO
    },
    {
      name: "einddatum",
      type: "string", // TODO: Support date(range)
      filterable: false, // TODO
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
  ].map((field) => {
    const isActiveFromStorage = fieldSelectionState?.[field.name];
    const isActive =
      typeof isActiveFromStorage === "undefined"
        ? field.active !== false
        : isActiveFromStorage;
    return { ...field, active: isActive } as TypedField;
  });

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
          destructionListCreateKey,
          attributeData as unknown as Zaak[],
        )
      : await removeFromZaakSelection(
          destructionListCreateKey,
          attributeData.length
            ? (attributeData as unknown as Zaak[])
            : zaken.results,
        );
  };

  return (
    <ListTemplate
      errors={Object.values(errors)}
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
          selectionActions: [
            {
              children: "Vernietigingslijst aanmaken",
              onClick: onSubmitSelection,
              wrap: false,
            },
          ],

          labelSelect: `Zaak {identificatie} toevoegen aan selectie`,
          labelSelectAll: "Selecteer {countPage} op pagina",
          title: title,
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
    />
  );
}
