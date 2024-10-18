import {
  AttributeData,
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

import { DestructionList } from "../../../lib/api/destructionLists";
import { Review } from "../../../lib/api/review";
import { PaginatedZaken } from "../../../lib/api/zaken";
import { Zaak } from "../../../types";
import { DestructionListToolbar } from "../detail/components";
import { useFields } from "../hooks/useFields";
import { useFilter } from "../hooks/useFilter";
import { usePage } from "../hooks/usePage";
import { useSort } from "../hooks/useSort";
import {
  ZaakSelectionDetailGetter,
  ZaakSelectionZaakFilter,
  useZaakSelection,
} from "../hooks/useZaakSelection";

/** The template used to format urls to an external application providing zaak details. */
const REACT_APP_ZAAK_URL_TEMPLATE = process.env.REACT_APP_ZAAK_URL_TEMPLATE;

export type BaseListViewProps = React.PropsWithChildren<{
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

  extraFields?: TypedField[];
  filterSelectionZaken?: ZaakSelectionZaakFilter;
  getSelectionDetail?: ZaakSelectionDetailGetter;

  dataGridProps?: Partial<DataGridProps>;

  onClearZaakSelection?: () => void;
  onSelectionChange?: (rows: AttributeData[]) => void;
}>;

export function BaseListView({
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

  onClearZaakSelection,
  onSelectionChange,
}: BaseListViewProps) {
  const { state } = useNavigation();
  const [page, setPage] = usePage();
  const [, setFilterField] = useFilter();
  const [sort, setSort] = useSort();

  // Object list.
  const objectList = paginatedZaken.results.map((zaak) => ({
    ...zaak,
    href: formatMessage(REACT_APP_ZAAK_URL_TEMPLATE || "", zaak),
  }));

  // Fields.
  const [fields, setFields, filterTransform] = useFields(
    destructionList,
    review,
    extraFields,
  );

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

  return (
    <ListTemplate
      errors={errors}
      secondaryNavigationItems={secondaryNavigationItems}
      dataGridProps={{
        aProps: {
          target: "_blank",
        },
        boolProps: {
          explicit: true,
        },
        fieldsSelectable: true,
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
        fields,
        filterTransform,
        loading: state === "loading",
        objectList: objectList,
        page,
        sort: sortable && sort,
        selected: selectable
          ? ([
              ...new Map(
                selectedZakenOnPage.map((zaak) => [zaak["uuid"], zaak]),
              ).values(),
            ] as unknown as AttributeData[])
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
      }}
    >
      <DestructionListToolbar title={title} />
      {children}
    </ListTemplate>
  );
}
