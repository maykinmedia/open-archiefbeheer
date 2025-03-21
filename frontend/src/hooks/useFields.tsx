import {
  Placeholder,
  TypedField,
  TypedSerializedFormData,
} from "@maykin-ui/admin-ui";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DestructionList } from "../lib/api/destructionLists";
import {
  listSelectielijstKlasseChoices,
  listZaaktypeChoices,
} from "../lib/api/private";
import { Review } from "../lib/api/review";
import {
  FieldSelection,
  addToFieldSelection,
  getFieldSelection,
  removeFromFieldSelection,
} from "../lib/fieldSelection/fieldSelection";
import { formatDate } from "../lib/format/date";
import { params2CacheKey } from "../lib/format/params";
import { FIELD_SELECTION_STORAGE_KEY } from "../pages/constants";
import { ExpandZaak, Zaak } from "../types";
import { useDataFetcher } from "./useDataFetcher";

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
 * s
 * @param [destructionList] - The destruction list to return fields for.
 * @param [review] - The destruction list to return fields for.
 * @param [extraFields] - Additional fields to add.
 * @param [restrictFilterChoices="list"] - Allows restricting choices in filters
 *  to either:
 *    - The destruction list or review (`list`).
 *    - To zaken not already assigned to a destruction list (`unassigned`).
 */
export function useFields<T extends Zaak = Zaak>(
  destructionList?: DestructionList,
  review?: Review,
  extraFields?: TypedField<T>[],
  restrictFilterChoices: "list" | "unassigned" | false = "list",
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

  const getZaakFilterParams = (clearField: string) => {
    // Fetch the zaaktype choices, if `restrictFilterChoices==="list"`:  only  zaaktype
    // choices of zaken belonging to either the destruction list or review  are loaded.
    // If `restrictFilterChoices==="unassigned"`: only zaaktype choices belonging to
    // zaken not assigned to any destruction list are loaded. If `restrictFilterChoices==="false"`:
    // all zaaktype choices are loaded.
    const zaakFilterParams = new URLSearchParams(searchParams);

    if (restrictFilterChoices === "list") {
      if (destructionList) {
        zaakFilterParams.set("inDestructionList", destructionList.uuid);
      }
      if (review?.pk) {
        zaakFilterParams.set("inReview", review.pk.toString());
      }
    }
    if (restrictFilterChoices === "unassigned") {
      zaakFilterParams.set("not_in_destruction_list", "true");
    }

    zaakFilterParams.delete(clearField);
    return zaakFilterParams;
  };

  const selectielijstklasseParams = getZaakFilterParams("selectielijstklasse");
  const { data: selectielijstKlasseChoices } = useDataFetcher(
    (signal) =>
      listSelectielijstKlasseChoices(selectielijstklasseParams, false, signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van selectielijst klassen!",
      initialState: [],
    },
    [params2CacheKey(selectielijstklasseParams || {})],
  );

  const zaaktypeParams = getZaakFilterParams("zaaktype");
  const { data: zaaktypeChoices } = useDataFetcher(
    (signal) => listZaaktypeChoices(zaaktypeParams, false, signal),
    {
      errorMessage: "Er is een fout opgetreden bij het ophalen van zaaktypen!",
      initialState: [],
    },
    [params2CacheKey(zaaktypeParams || {})],
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
      width: "150px",
    },
    {
      name: "zaaktype",
      filterLookup: "zaaktype",
      filterValue: searchParams.get("zaaktype") || "",
      valueTransform: (zaak) => {
        const expandZaak = zaak as T & {
          _expand: { zaaktype: { identificatie: string } };
        };
        const zaaktype = expandZaak._expand.zaaktype.identificatie;

        // Zaaktype choices not yet loaded.
        if (zaaktypeChoices === null) {
          return <Placeholder />;
        }

        // Find label by zaaktype choice.
        const zaaktypeChoice = zaaktypeChoices.find(
          ({ value }) => value === zaaktype,
        );

        // Return label, or null.
        return zaaktypeChoice?.label || zaaktype;
      },
      options: zaaktypeChoices || [],
      type: "string",
      width: "150px",
    },
    {
      name: "omschrijving",
      filterLookup: "omschrijving__icontains",
      filterValue: searchParams.get("omschrijving__icontains") || "",
      type: "string",
      width: "150px",
    },
    {
      active: false,
      name: "toelichting",
      type: "string",
      filterLookup: "toelichting__icontains",
      width: "150px",
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
      width: "230px",
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
      width: "230px",
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
      width: "150px",
    },
    {
      name: "selectielijstklasse",
      type: "string",
      filterValue: searchParams.get("selectielijstklasse") || "",
      // filterLookup: // TODO: Expand?
      valueTransform: (v: ExpandZaak) => {
        // selectielijstklasse choices not yet loaded.
        if (selectielijstKlasseChoices === null) {
          return <Placeholder />;
        }

        const zaakSelectielijstklasse =
          v.selectielijstklasse ||
          v._expand?.resultaat?._expand?.resultaattype?.selectielijstklasse;
        return (
          selectielijstKlasseChoices.find(
            (c) => c.value === zaakSelectielijstklasse,
          )?.label || <Placeholder />
        );
      },
      options: selectielijstKlasseChoices || [],
      width: "150px",
    },
    {
      name: "resultaat",
      filterLookup: "resultaat__resultaattype__omschrijving__icontains",
      filterValue:
        searchParams.get("resultaat__resultaattype__omschrijving__icontains") ||
        "",
      valueLookup: "_expand.resultaat._expand.resultaattype.omschrijving",
      type: "string",
      width: "150px",
    },
    {
      name: "archiefactiedatum",
      type: "daterange",
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
      width: "230px",
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
      width: "150px",
    },
    ...(extraFields || []).map((f) => ({
      filterable: false,
      sortable: false,
      width: "150px",
      ...f,
    })),
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
