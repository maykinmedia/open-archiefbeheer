import { TypedField, TypedSerializedFormData } from "@maykin-ui/admin-ui";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DestructionList } from "../lib/api/destructionLists";
import { Review } from "../lib/api/review";
import {
  FieldSelection,
  addToFieldSelection,
  getFieldSelection,
  removeFromFieldSelection,
} from "../lib/fieldSelection/fieldSelection";
import { formatDate } from "../lib/format/date";
import { FIELD_SELECTION_STORAGE_KEY } from "../pages/constants";
import { ExpandZaak, Zaak } from "../types";
import { useSelectielijstKlasseChoices } from "./useSelectielijstKlasseChoices";
import { useZaaktypeChoices } from "./useZaaktypeChoices";

type FilterTransformReturnType<T> = Record<
  | "startdatum__gte"
  | "startdatum__lte"
  | "einddatum__gte"
  | "einddatum__lte"
  | "archiefactiedatum__gte"
  | "archiefactiedatum__lte",
  string | null
> &
  Partial<
    Omit<
      TypedSerializedFormData<keyof T & string>,
      "startdatum" | "einddatum" | "archiefactiedatum"
    >
  >;

/**
 * Hook resolving the base fields for lists.
 */
export function useFields<T extends Zaak = Zaak>(
  destructionList?: DestructionList,
  review?: Review,
  extraFields?: TypedField<T>[],
): [
  TypedField<T>[],
  (fields: TypedField<T>[]) => void,
  (
    filterData: Partial<TypedSerializedFormData<keyof T & string>>,
  ) => FilterTransformReturnType<T>,
  Record<string, string>,
  () => void,
] {
  const [fieldSelectionState, setFieldSelectionState] =
    useState<FieldSelection>();
  useEffect(() => {
    getFieldSelection(FIELD_SELECTION_STORAGE_KEY).then((fieldSelection) =>
      setFieldSelectionState(fieldSelection),
    );
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectielijstKlasseChoices = useSelectielijstKlasseChoices();
  const zaaktypeChoices = useZaaktypeChoices(
    destructionList,
    review,
    searchParams,
  );

  // The raw, unfiltered configuration of the available base fields.
  // Both filterLookup AND filterLookups will be used for clearing filters.
  // NOTE: This get filtered by `getActiveFields()`.
  const fields: (TypedField<T> & { filterLookups?: string[] })[] = [
    {
      name: "identificatie",
      filterLookup: "identificatie__icontains",
      filterValue: searchParams.get("identificatie__icontains") || "",
      type: "string",
      width: "300px",
    },
    {
      name: "zaaktype",
      filterLookup: "zaaktype__in",
      filterValue: searchParams.get("zaaktype__in") || "",
      options: zaaktypeChoices,
      type: "string",
      width: "300px",
    },
    {
      name: "omschrijving",
      filterLookup: "omschrijving__icontains",
      filterValue: searchParams.get("omschrijving__icontains") || "",
      type: "string",
      width: "300px",
    },
    {
      active: false,
      name: "toelichting",
      type: "string",
      filterLookup: "toelichting__icontains",
      width: "300px",
    },
    {
      name: "startdatum",
      type: "daterange",
      filterLookups: ["startdatum__gte", "startdatum__lte"],
      filterValue:
        searchParams.get("startdatum__gte") &&
        searchParams.get("startdatum__lte")
          ? `${searchParams.get("startdatum__gte")}/${searchParams.get("startdatum__lte")}`
          : undefined,
      valueTransform: (rowData) =>
        rowData.startdatum ? formatDate(rowData.startdatum as string) : "",
      width: "150px",
    },
    {
      name: "einddatum",
      type: "daterange",
      filterLookups: ["einddatum__gte", "einddatum__lte"],
      filterValue:
        searchParams.get("einddatum__gte") && searchParams.get("einddatum__lte")
          ? `${searchParams.get("einddatum__gte")}/${searchParams.get("einddatum__lte")}`
          : undefined,
      valueTransform: (rowData) =>
        rowData.einddatum ? formatDate(rowData.einddatum as string) : "",
      width: "150px",
    },
    {
      name: "Behandelende afdeling",
      type: "string",
      filterLookup: "behandelend_afdeling__icontains",
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
      width: "180px",
    },
    {
      name: "selectielijstklasse",
      type: "string",
      // filterLookup: // TODO: Expand?
      options: selectielijstKlasseChoices,
      width: "180px",
    },
    {
      name: "resultaat",
      filterLookup: "resultaat__resultaattype__omschrijving__icontains",
      filterValue:
        searchParams.get("resultaat__resultaattype__omschrijving__icontains") ||
        "",
      valueLookup: "_expand.resultaat._expand.resultaattype.omschrijving",
      type: "string",
      width: "180px",
    },
    {
      name: "archiefactiedatum",
      type: "daterange",
      width: "130px",
      filterLookups: ["archiefactiedatum__gte", "archiefactiedatum__lte"],
      filterValue:
        searchParams.get("archiefactiedatum__gte") &&
        searchParams.get("archiefactiedatum__lte")
          ? `${searchParams.get("archiefactiedatum__gte")}/${searchParams.get("archiefactiedatum__lte")}`
          : undefined,
      valueTransform: (rowData) =>
        rowData.archiefactiedatum
          ? formatDate(rowData.archiefactiedatum as string)
          : "",
    },
    {
      name: "archiefnominatie",
      active: false,
      filterValue: searchParams.get("archiefnominatie") || "",
      type: "string",
      options: [
        { label: "Blijvend bewaren", value: "blijvend_bewaren" },
        { label: "Vernietigen", value: "vernietigen" },
      ],
      width: "180px",
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
    {
      name: "hoofdzaak",
      active: false,
      type: "string",
      // valueLookup: // TODO: Expand?
      width: "180px",
    },
    ...(extraFields || []),
  ];

  const filterLookupValues = [
    ...new Set(
      fields
        .flatMap((field) => [
          field.filterLookup,
          ...(field.filterLookups || []),
        ])
        .filter(Boolean),
    ),
  ];

  const getActiveFields = useCallback(() => {
    return fields.map((field) => {
      const isActiveFromStorage =
        fieldSelectionState?.[field.name as keyof typeof fieldSelectionState];
      const isActive =
        typeof isActiveFromStorage === "undefined"
          ? field.active !== false
          : isActiveFromStorage;
      return { ...field, active: isActive };
    });
  }, [fields, fieldSelectionState]);

  /**
   * Function to reset all the filters
   * It will concat all the `filterLookup` and `filterLookups` values from the `fields` array and remove them from the searchParams
   */
  const resetFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    filterLookupValues.forEach((filterLookup) => {
      if (!filterLookup) return;
      newSearchParams.delete(filterLookup);
    });
    setSearchParams(newSearchParams);
  };

  /**
   * A function to return the current active filters
   */
  const getActiveFilters = () => {
    const activeFilters: Record<string, string> = {};
    filterLookupValues.forEach((filterLookup) => {
      if (!filterLookup) return;
      const value = searchParams.get(filterLookup);
      if (value) {
        activeFilters[filterLookup] = value;
      }
    });
    return activeFilters;
  };

  /**
   * Gets called when the fields selection is changed.
   * Pass this to `filterTransform` of a DataGrid component.
   * @param fields
   */
  const setFields = async (fields: TypedField<T>[]) => {
    const activeFields = fields.filter((f) => f.active !== false);
    const inActiveFields = fields.filter((f) => f.active === false);
    await addToFieldSelection(FIELD_SELECTION_STORAGE_KEY, activeFields);
    await removeFromFieldSelection(FIELD_SELECTION_STORAGE_KEY, inActiveFields);
    const fieldSelection = await getFieldSelection(FIELD_SELECTION_STORAGE_KEY);
    setFieldSelectionState(fieldSelection);
  };

  /**
   * Serializes row data for use with filter/XHR request.
   * Pass this to `filterTransform` of a DataGrid component.
   * @param filterData
   */
  const filterTransform = (
    filterData: Partial<TypedSerializedFormData<keyof T & string>>,
  ): FilterTransformReturnType<T> => {
    const { startdatum, einddatum, archiefactiedatum, ..._filterData } =
      filterData;

    const formatDateRange = (dates: Date[] | undefined) =>
      dates ? dates.map((d) => formatDate(d, "iso")) : [null, null];

    const [startdatum__gte, startdatum__lte] = formatDateRange(
      startdatum as Date[] | undefined,
    );
    const [einddatum__gte, einddatum__lte] = formatDateRange(
      einddatum as Date[] | undefined,
    );
    const [archiefactiedatum__gte, archiefactiedatum__lte] = formatDateRange(
      archiefactiedatum as Date[] | undefined,
    );

    return {
      startdatum__gte,
      startdatum__lte,
      einddatum__gte,
      einddatum__lte,
      archiefactiedatum__gte,
      archiefactiedatum__lte,
      ..._filterData,
    };
  };

  return [
    getActiveFields(),
    setFields,
    filterTransform,
    getActiveFilters(),
    resetFilters,
  ];
}
