import {
  ButtonProps,
  DataGridProps,
  ListTemplate,
  ListTemplateProps,
  Solid,
  TypedField,
  formatMessage,
} from "@maykin-ui/admin-ui";
import React, { useCallback, useMemo } from "react";
import { useNavigation } from "react-router-dom";

import { DestructionListToolbar } from "../../../components";
import {
  ZaakSelectionDetailGetter,
  ZaakSelectionZaakFilter,
  useZaakSelection,
} from "../../../hooks";
import { useFields, useFilter, usePage, useSort } from "../../../hooks";
import { DestructionList } from "../../../lib/api/destructionLists";
import { Review } from "../../../lib/api/review";
import { PaginatedZaken } from "../../../lib/api/zaken";
import {
  SessionStorageBackend,
  ZaakSelectionBackend,
} from "../../../lib/zaakSelection";
import { Zaak } from "../../../types";

/** The template used to format urls to an external application providing zaak details. */
const REACT_APP_ZAAK_URL_TEMPLATE = process.env.REACT_APP_ZAAK_URL_TEMPLATE;

export type BaseListViewProps<T extends Zaak = Zaak> = React.PropsWithChildren<{
  storageKey: string;
  title?: string;
  errors?: string | string[];

  destructionList?: DestructionList;
  review?: Review;
  paginatedZaken: PaginatedZaken;
  secondaryNavigationItems?: ListTemplateProps["secondaryNavigationItems"];

  // Visible means that no checkboxes appear, but the zaken are marked if selected (via another route).
  selectable?: boolean | "visible";
  allowSelectAllPages?: boolean;
  selectionActions?: ButtonProps[];
  initiallySelectedZakenOnPage?: Zaak[];
  sortable?: boolean;

  extraFields?: TypedField<T>[];
  filterSelectionZaken?: ZaakSelectionZaakFilter;
  getSelectionDetail?: ZaakSelectionDetailGetter;

  dataGridProps?: Partial<DataGridProps<T>>;

  enableUseZaakSelection?: boolean;
  selectionBackend?: ZaakSelectionBackend | null;
  onClearZaakSelection?: () => void;
  onSelectionChange?: (rows: T[]) => void;
}>;

export function BaseListView<T extends Zaak = Zaak>({
  storageKey,
  title,
  errors,

  destructionList,
  review,
  paginatedZaken,
  secondaryNavigationItems,

  selectable = true,
  allowSelectAllPages,
  selectionActions,
  initiallySelectedZakenOnPage = [],
  sortable = true,

  extraFields,
  filterSelectionZaken,
  getSelectionDetail,

  dataGridProps,

  children,

  selectionBackend = SessionStorageBackend,
  onClearZaakSelection,
  onSelectionChange,
}: BaseListViewProps<T>) {
  const { state } = useNavigation();
  const [page, setPage] = usePage();
  const [sort, setSort] = useSort();

  // Object list.
  const objectList = paginatedZaken.results.map((zaak) => ({
    ...zaak,
    href: formatMessage(REACT_APP_ZAAK_URL_TEMPLATE || "", zaak),
  })) as unknown as T[];

  // Fields.
  const [fields, setFields, filterTransform] = useFields<T>(
    destructionList,
    review,
    extraFields,
  );
  type FilterTransformData = ReturnType<typeof filterTransform>;

  // Filter.
  const [, setFilterField] = useFilter<FilterTransformData>();

  // Selection.
  const [
    _selectedZakenOnPage,
    handleSelect,
    {
      deSelectedZakenOnPage,
      hasSelection: _hasSelection,
      allPagesSelected,
      handleSelectAllPages,
      clearZaakSelection,
    },
  ] = useZaakSelection(
    storageKey,
    paginatedZaken.results,
    filterSelectionZaken,
    getSelectionDetail,
    selectionBackend,
  );

  const selectedZakenOnPage = useMemo(() => {
    const deselectedZaakUrls = deSelectedZakenOnPage.map(
      (z) => z.url as string,
    );
    const filteredInitiallySelectedZakenOnPage =
      initiallySelectedZakenOnPage.filter(
        (z) => !deselectedZaakUrls.includes(z.url as string),
      );

    return [...filteredInitiallySelectedZakenOnPage, ..._selectedZakenOnPage];
  }, [
    deSelectedZakenOnPage,
    initiallySelectedZakenOnPage,
    _selectedZakenOnPage,
  ]);

  // Merge `hasSelection`.
  const hasSelection = _hasSelection || selectedZakenOnPage.length > 0;

  const handleClearZaakSelection = () => {
    clearZaakSelection();
    onClearZaakSelection?.();
  };

  // Selection actions.
  const getSelectionActions = useCallback(() => {
    const disabled = selectable && hasSelection;
    const dynamicItems = (selectionActions || []).map((props) =>
      Object.hasOwn(props, "disabled")
        ? props
        : { ...props, disabled: selectable && !hasSelection },
    );
    const fixedItems = disabled
      ? ([
          {
            children: (
              <>
                <Solid.ExclamationTriangleIcon />
                Huidige selectie wissen
              </>
            ),
            variant: "warning",
            wrap: false,
            onClick: handleClearZaakSelection,
          },
        ] as ButtonProps[])
      : [];
    return [...dynamicItems, ...fixedItems];
  }, [selectable, hasSelection, selectedZakenOnPage, selectionActions]);

  const hasVerticalOverflow =
    document.documentElement.scrollHeight >
    document.documentElement.clientHeight;

  return (
    <ListTemplate<T, FilterTransformData>
      errors={errors}
      secondaryNavigationItems={secondaryNavigationItems}
      dataGridProps={
        {
          aProps: {
            target: "_blank",
          },
          boolProps: {
            explicit: true,
          },
          fieldsSelectable: true,
          // If no vertical scrolling is applied, used (slower) 100% height to
          // push paginator down at bottom of page.
          // This triggers a "stickyfill" behaviour which is slower than native
          // sticky which is not compatible with the percentage value.
          height: hasVerticalOverflow ? undefined : "100%",
          pageSize: 100,
          showPaginator: true,
          selectable: selectable === true,
          filterable: true,
          tableLayout: "fixed",

          allowSelectAllPages,
          allPagesSelected,
          count: paginatedZaken.count,
          equalityChecker: (a, b) =>
            a && b && (a.uuid === b.uuid || a.url === b.url),
          fields: fields,
          filterTransform,
          loading: state !== "idle",
          objectList: objectList,
          page,
          sort: sortable && sort,
          selected: selectable
            ? ([
                ...new Map(
                  selectedZakenOnPage.map((zaak) => [zaak["uuid"], zaak]),
                ).values(),
              ] as T[])
            : [],
          selectionActions: getSelectionActions(),

          onFieldsChange: setFields,
          onFilter: setFilterField,
          onPageChange: setPage,
          onSelect: handleSelect,
          onSelectAllPages: handleSelectAllPages,
          onSelectionChange: onSelectionChange,
          onSort: setSort,

          ...dataGridProps,
        } as DataGridProps<T, FilterTransformData>
      }
    >
      <DestructionListToolbar
        title={title}
        destructionList={destructionList}
        review={review}
      />
      {children}
    </ListTemplate>
  );
}
