import {
  AttributeData,
  Button,
  ButtonProps,
  DataGridProps,
  Option,
  Solid,
  Tooltip,
  TypedField,
  formatMessage,
} from "@maykin-ui/admin-ui";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  useNavigation,
  useRevalidator,
  useSearchParams,
} from "react-router-dom";

import { ProcessingStatusBadge } from "../../../components/ProcessingStatusBadge";
import { DestructionList } from "../../../lib/api/destructionLists";
import {
  DestructionListItem,
  PaginatedDestructionListItems,
  ZaakItem,
} from "../../../lib/api/destructionListsItem";
import {
  ZaaktypeChoice,
  listSelectieLijstKlasseChoices,
  listZaaktypeChoices,
} from "../../../lib/api/private";
import { Review } from "../../../lib/api/review";
import { PaginatedZaken } from "../../../lib/api/zaken";
import {
  FieldSelection,
  addToFieldSelection,
  getFieldSelection,
  removeFromFieldSelection,
} from "../../../lib/fieldSelection/fieldSelection";
import { formatDate } from "../../../lib/format/date";
import {
  addToZaakSelection,
  clearZaakSelection,
  getZaakSelection,
  removeFromZaakSelection,
  setAllZakenSelected,
} from "../../../lib/zaakSelection/zaakSelection";
import { ExpandZaak, Zaak } from "../../../types";
import { FIELD_SELECTION_STORAGE_KEY } from "../../constants";

/** The template used to format urls to an external application providing zaak details. */
const REACT_APP_ZAAK_URL_TEMPLATE = process.env.REACT_APP_ZAAK_URL_TEMPLATE;

export interface DataGridAction extends Omit<ButtonProps, "onClick"> {
  title: string;
  tooltip?: ReactNode;
  onInteract?: (zaak: Zaak, detail?: unknown) => void;
  onClick?: (zaak: Zaak, detail?: unknown) => void;
}

/**
 * Hook that returns base props for most Zaak related DataGrid components.
 * TODO: Optimize and organize (args).
 */
export function useDataGridProps(
  storageKey: string,
  paginatedResults: PaginatedDestructionListItems | PaginatedZaken,
  selectedUrls: string[],
  allZakenSelected?: boolean,
  actions?: DataGridAction[],
  destructionListUuid?: DestructionList["uuid"],
  reviewPk?: Review["pk"],
  onClearSelection?: () => void | Promise<void>,
): { props: DataGridProps; error: unknown } {
  const { state } = useNavigation();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [errorState, setErrorState] = useState<unknown>();

  //
  // List available zaaktype choices.
  //
  const [zaaktypeChoicesState, setZaaktypeChoicesState] = useState<
    ZaaktypeChoice[]
  >([]);
  const [selectieLijstKlasseChoicesState, setSelectieLijstKlasseChoicesState] =
    useState<Option[]>([]);

  useEffect(() => {
    const fetchChoices = async () => {
      try {
        const [selectieLijstKlasseChoices, zaaktypeChoices] = await Promise.all(
          [
            // TODO (possibly): This curreently isn't performant. It's returning 600+ results, of which we most likely only need a few per page
            listSelectieLijstKlasseChoices(),
            listZaaktypeChoices(destructionListUuid, reviewPk),
          ],
        );

        setSelectieLijstKlasseChoicesState(selectieLijstKlasseChoices);
        setZaaktypeChoicesState(zaaktypeChoices);
      } catch (error) {
        setErrorState(error);
      }
    };
    fetchChoices();
  }, []);

  /**
   * Renders a special set of action buttons as column data for `zaak`.
   * @param zaak
   * @param actions
   */
  const renderActionButtons = (zaak: Zaak, actions?: DataGridAction[]) => {
    return actions?.map(
      ({ onClick, onInteract, tooltip, ...action }, index) => {
        const handleAction = async (
          zaak: Zaak,
          actionFn?: (zaak: Zaak, detail?: unknown) => void,
        ) => {
          const foundZaak = await getSpecificZaakSelection(zaak.url as string);
          actionFn?.(zaak, foundZaak);
        };

        const ButtonComponent = (
          <Button
            pad={false}
            variant={"transparent"}
            key={index}
            onClick={() => handleAction(zaak, onClick)}
            onMouseEnter={() => {
              return handleAction(zaak, onInteract);
            }}
            onFocusCapture={() => {
              return handleAction(zaak, onInteract);
            }}
            {...action}
          />
        );

        if (tooltip) {
          return (
            <Tooltip
              key={index}
              content={tooltip}
              placement={"bottom-start"}
              size="lg"
            >
              {ButtonComponent}
            </Tooltip>
          );
        }

        return ButtonComponent;
      },
    );
  };

  //
  // Get object list.
  //
  const formatZaak = (zaak: Zaak) => {
    return {
      ...zaak,
      startdatum: zaak.startdatum ? formatDate(zaak.startdatum) : "",
      einddatum: zaak.einddatum ? formatDate(zaak.einddatum) : "",
      archiefactiedatum: zaak.archiefactiedatum,
      einddatumGepland: zaak.einddatumGepland,
      href: formatMessage(REACT_APP_ZAAK_URL_TEMPLATE || "", zaak),
      acties: <>{renderActionButtons(zaak, actions)}</>,
      selectielijstklasse: selectieLijstKlasseChoicesState.find(
        (choice) => choice.value === zaak.selectielijstklasse,
      )?.label,
    };
  };

  /**
   * a (normalized) array of objects containing the row data to render.
   */
  const objectList = useMemo(
    () =>
      paginatedResults.results.map((itemOrZaak) => {
        if (Object.hasOwn(itemOrZaak, "zaak")) {
          const item = itemOrZaak as DestructionListItem;

          return {
            ...(item.zaak ? formatZaak(item.zaak) : item.extraZaakData),
            processingStatus: (
              <ProcessingStatusBadge processingStatus={item.processingStatus} />
            ),
          };
        }
        const zaak = itemOrZaak as Zaak;
        return formatZaak(zaak);
      }) as ZaakItem[],
    [paginatedResults, selectieLijstKlasseChoicesState],
  );

  /**
   * Returns the items on `paginatedResults.results` that are selected according to `zaakSelection`.
   */
  const selectedZakenOnPage = useMemo(() => {
    return objectList.filter((zOrI: ZaakItem) => {
      return selectedUrls.includes(zOrI.url || "");
    });
  }, [objectList, selectedUrls]);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const setParams = (params: Record<string, string>) => {
    const handle = () => {
      const combinedParams = {
        ...Object.fromEntries(searchParams),
        ...params,
      };

      const activeParams = Object.fromEntries(
        Object.entries(combinedParams).filter(
          (keyValuePair) => keyValuePair[1],
        ),
      );
      setSearchParams(new URLSearchParams(activeParams));
    };
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handle, 100);
  };

  //
  // Update (selected) fields.
  //
  const [fieldSelectionState, setFieldSelectionState] =
    useState<FieldSelection>();
  useEffect(() => {
    getFieldSelection(FIELD_SELECTION_STORAGE_KEY).then((fieldSelection) =>
      setFieldSelectionState(fieldSelection),
    );
  }, []);

  //
  // Gets a specific zaak selection based on the url.
  //
  const getSpecificZaakSelection = async (url: string) => {
    const zaakSelection = await getZaakSelection(storageKey);
    if (!zaakSelection[url]?.selected) return;
    return zaakSelection[url].detail;
  };

  const hasActions = Boolean(actions?.length);
  const fields = getFields(searchParams, zaaktypeChoicesState, hasActions).map(
    (field) => {
      const isActiveFromStorage = fieldSelectionState?.[field.name];
      const isActive =
        typeof isActiveFromStorage === "undefined"
          ? field.active !== false
          : isActiveFromStorage;
      return { ...field, active: isActive } as TypedField;
    },
  );

  const selectionActions: ButtonProps[] =
    allZakenSelected || selectedUrls.length
      ? [
          {
            children: (
              <>
                <Solid.ExclamationTriangleIcon />
                Huidige selectie wissen (
                {allZakenSelected
                  ? paginatedResults.count
                  : selectedUrls.length}
                &nbsp;geselecteerd)
              </>
            ),
            variant: "warning",
            wrap: false,
            onClick: async () => {
              await clearZaakSelection(storageKey);
              await setAllZakenSelected(storageKey, false);
              revalidator.revalidate();
              await onClearSelection?.();
            },
          },
        ]
      : [];

  /**
   * Gets called when the fields selection is changed.
   * @param fields
   */
  const onFieldsChange = async (fields: TypedField[]) => {
    const activeFields = fields.filter((f) => f.active !== false);
    const inActiveFields = fields.filter((f) => f.active === false);
    await addToFieldSelection(FIELD_SELECTION_STORAGE_KEY, activeFields);
    await removeFromFieldSelection(FIELD_SELECTION_STORAGE_KEY, inActiveFields);
    const fieldSelection = await getFieldSelection(FIELD_SELECTION_STORAGE_KEY);
    setFieldSelectionState(fieldSelection);
  };

  /**
   * Gets called when a filter value is changed.
   * @param filterData
   */
  const onFilter = (filterData: AttributeData) => {
    setParams({ ...(filterData as AttributeData<string>), page: "1" });
  };

  /**
   * Gets called when the page is changed.
   * @param page
   */
  const onPageChange = (page: number) => {
    setParams({
      page: String(page),
    });
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
    const zaken = paginatedResults.results.map((iorz) =>
      Object.hasOwn(iorz, "zaak")
        ? ((iorz as DestructionListItem).zaak as Zaak)
        : (iorz as Zaak),
    );

    selected
      ? await addToZaakSelection(storageKey, attributeData as unknown as Zaak[])
      : await removeFromZaakSelection(
          storageKey,
          attributeData.length ? (attributeData as unknown as Zaak[]) : zaken,
        );

    revalidator.revalidate();
  };

  /**
   * Gets called when the select all pages checkbox is toggled.
   * @param selected
   */
  const onSelectAllPages = async (selected: boolean) => {
    setAllZakenSelected(storageKey, selected);
    revalidator.revalidate();
  };

  const onSort = (sort: string) => {
    setParams({ ordering: sort });
  };

  //
  // Build props.
  //
  const page = Number(searchParams.get("page")) || 1;
  const props: DataGridProps = {
    aProps: {
      target: "_blank",
    },
    boolProps: {
      explicit: true,
    },
    count: paginatedResults.count,
    equalityChecker: (a, b) => a.uuid === b.uuid || a.url === b.url,
    fields: fields,
    fieldsSelectable: true,
    loading: state === "loading",
    objectList: objectList as unknown as AttributeData[],
    page: page,
    pageSize: 100,
    showPaginator: true,
    selectable: true,
    selected: selectedZakenOnPage as unknown as AttributeData[],
    selectionActions: selectionActions,
    allPagesSelected: allZakenSelected,
    allowSelectAllPages: typeof allZakenSelected === "boolean",
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
    sort: searchParams.get("ordering") || true, // fixme
    tableLayout: "fixed",
    onPageChange,
    onFieldsChange,
    onFilter,
    onSelect,
    onSort: onSort,
    onSelectAllPages,
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
 * Returns base fields for DataGrid components.
 * @param searchParams
 * @param zaaktypeChoices
 */
export function getFields(
  searchParams: URLSearchParams,
  zaaktypeChoices: ZaaktypeChoice[],
  hasActions: boolean,
): TypedField[] {
  return [
    {
      name: "identificatie",
      filterLookup: "identificatie__icontains",
      filterValue: searchParams.get("identificatie__icontains") || "",
      type: "string",
      width: "300px",
    },
    {
      name: "archiefnominatie",
      filterValue: searchParams.get("archiefnominatie") || "",
      type: "string",
      options: [
        { label: "Blijvend bewaren", value: "blijvend_bewaren" },
        { label: "Vernietigen", value: "vernietigen" },
      ],
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
      name: "startdatum",
      type: "daterange",
      width: "150px",
    },
    {
      name: "einddatum",
      type: "daterange",
      width: "150px",
    },
    {
      name: "zaaktype",
      filterLookup: "zaaktype__in",
      filterValue: searchParams.get("zaaktype__in") || "",
      valueLookup: "_expand.zaaktype.identificatie",
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
      name: "Behandelend afdeling",
      active: false,
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
      name: "archiefactiedatum",
      type: "daterange",
      width: "130px",
      valueTransform: (rowData: object) => dateTransform(rowData as Zaak),
    },
    {
      active: false,
      name: "selectielijstklasse",
      type: "string",
      // filterLookup: // TODO: Expand?
      width: "180px",
    },
    {
      name: "hoofdzaak",
      type: "string",
      // valueLookup: // TODO: Expand?
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
    ...([hasActions && { name: "acties", type: "string" }].filter(
      Boolean,
    ) as TypedField[]),
  ];
}

function dateTransform(zaak: Zaak) {
  if (!zaak.archiefactiedatum) {
    return null;
  }
  return formatDate(zaak.archiefactiedatum);
}
