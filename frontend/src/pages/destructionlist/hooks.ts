import {
  AttributeData,
  DataGridProps,
  TypedField,
  formatMessage,
} from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";
import { useNavigation, useSearchParams } from "react-router-dom";

import { ZaaktypeChoice, listZaaktypeChoices } from "../../lib/api/private";
import { PaginatedZaken } from "../../lib/api/zaken";
import {
  FieldSelection,
  addToFieldSelection,
  getFieldSelection,
  removeFromFieldSelection,
} from "../../lib/fieldSelection/fieldSelection";
import {
  addToZaakSelection,
  removeFromZaakSelection,
} from "../../lib/zaakSelection/zaakSelection";
import { ExpandZaak, Zaak } from "../../types";

/** The template used to format urls to an external application providing zaak details. */
const REACT_APP_ZAAK_URL_TEMPLATE = process.env.REACT_APP_ZAAK_URL_TEMPLATE;

/**
 * Hook that returns base props for most Zaak related DataGrid components.
 */
export function useDataGridProps(
  storageKey: string,
  paginatedResults: PaginatedZaken,
  selectedResults: Zaak[],
): { props: DataGridProps; error: unknown } {
  const { state } = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = useState<URLSearchParams>(searchParams);
  const [errorState, setErrorState] = useState<unknown>();
  const debouncedParams = useDebounce(params, 10);

  useEffect(() => {
    setSearchParams(debouncedParams);
  }, [debouncedParams]);

  //
  // List available zaaktype choices.
  //
  const [zaaktypeChoicesState, setZaaktypeChoicesState] = useState<
    ZaaktypeChoice[]
  >([]);
  useEffect(() => {
    listZaaktypeChoices()
      .then((z) => setZaaktypeChoicesState(z))
      .catch((e) => setErrorState(e));
  }, []);

  //
  // Update (selected) fields.
  //
  const [fieldSelectionState, setFieldSelectionState] =
    useState<FieldSelection>();

  useEffect(() => {
    getFieldSelection(storageKey).then((fieldSelection) =>
      setFieldSelectionState(fieldSelection),
    );
  }, []);

  const fields = getFields(searchParams, zaaktypeChoicesState).map((field) => {
    const isActiveFromStorage = fieldSelectionState?.[field.name];
    const isActive =
      typeof isActiveFromStorage === "undefined"
        ? field.active !== false
        : isActiveFromStorage;
    return { ...field, active: isActive } as TypedField;
  });

  //
  // Get object list.
  //
  const objectList = paginatedResults.results.map((zaak) => ({
    ...zaak,
    href: formatMessage(REACT_APP_ZAAK_URL_TEMPLATE || "", zaak),
  })) as unknown as AttributeData[];

  /**
   * Gets called when the fields selection is changed.
   * @param fields
   */
  const onFieldsChange = async (fields: TypedField[]) => {
    const activeFields = fields.filter((f) => f.active !== false);
    const inActiveFields = fields.filter((f) => f.active === false);
    await addToFieldSelection(storageKey, activeFields);
    await removeFromFieldSelection(storageKey, inActiveFields);
    const fieldSelection = await getFieldSelection(storageKey);
    setFieldSelectionState(fieldSelection);
  };

  /**
   * Gets called when a filter value is changed.
   * @param filterData
   */
  const onFilter = (filterData: AttributeData) => {
    const combinedParams = {
      ...Object.fromEntries(searchParams),
      ...filterData,
      page: "1",
    };

    const activeParams = Object.fromEntries(
      Object.entries(combinedParams).filter((keyValuePair) => keyValuePair[1]),
    );

    setParams(new URLSearchParams(activeParams));
  };

  /**
   * Gets called when the page is changed.
   * @param page
   */
  const onPageChange = (page: number) => {
    setParams(
      new URLSearchParams({
        ...Object.fromEntries(searchParams),
        page: String(page),
      }),
    );
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
      ? await addToZaakSelection(storageKey, attributeData as unknown as Zaak[])
      : await removeFromZaakSelection(
          storageKey,
          attributeData.length
            ? (attributeData as unknown as Zaak[])
            : paginatedResults.results,
        );
  };

  //
  // Build props.
  //
  const props: DataGridProps = {
    aProps: {
      target: "_blank",
    },
    boolProps: {
      explicit: true,
    },
    count: paginatedResults.count,
    equalityChecker: (a, b) => a.uuid === b.uuid,
    fields: fields,
    fieldsSelectable: true,
    loading: state === "loading",
    objectList: objectList,
    pageSize: 100,
    showPaginator: true,
    selectable: true,
    selected: selectedResults as unknown as AttributeData[],
    filterable: true,
    filterTransform: (filterData: AttributeData) => {
      const {
        startdatum = "",
        einddatum = "",
        archiefactiedatum = "",
        ..._filterData
      } = filterData;

      const [startdatum__gte = "", startdatum__lte = ""] =
        String(startdatum).split("/");
      const [einddatum__gte = "", einddatum__lte = ""] =
        String(einddatum).split("/");
      const [archiefactiedatum__gte = "", archiefactiedatum__lte = ""] =
        String(archiefactiedatum).split("/");

      return {
        startdatum__gte,
        startdatum__lte,
        einddatum__gte,
        einddatum__lte,
        archiefactiedatum__gte,
        archiefactiedatum__lte,
        ..._filterData,
      };
    },
    page: Number(searchParams.get("page")) || 1,
    onPageChange,
    onFieldsChange,
    onFilter,
    onSelect,
  };

  //
  // Return
  //
  return {
    props,
    error: errorState,
  };
}

/**
 * Denounces update of `value` with `delay`ms
 * @param value
 * @param delay
 */
export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>();
  let handler: NodeJS.Timeout | undefined = undefined;

  useEffect(() => {
    if (handler && JSON.stringify(value) === JSON.stringify(debouncedValue)) {
      return;
    }
    handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns base fields for DataGrid components.
 * @param searchParams
 * @param zaaktypeChoices
 */
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
    {
      name: "Behandelend afdeling",
      active: false,
      type: "string",
      filterLookup: "behandelend_afdeling",
      valueTransform: (rowData: object) => {
        const rollen = (rowData as ExpandZaak)._expand?.rollen || [];
        if (!rollen.length) return "";
        const behandelendAfdeling: string[] = [];
        // TODO - Understand why the ExpandZaak type doesn't work
        rollen.map((role) => {
          if (
            // @ts-expect-error The type of role is 'never' for some reason
            role.betrokkeneType === "organisatorische_eenheid" &&
            // @ts-expect-error The type of role is 'never' for some reason
            role.betrokkeneIdentificatie?.identificatie
          )
            behandelendAfdeling.push(
              // @ts-expect-error The type of role is 'never' for some reason
              role.betrokkeneIdentificatie?.identificatie,
            );
        });
        return behandelendAfdeling.join(", ");
      },
    },
    {
      name: "archiefactiedatum",
      type: "daterange",
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
