import {
  AttributeData,
  ButtonProps,
  DataGridProps,
  ListTemplate,
  ListTemplateProps,
  Solid,
  TypedField,
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

export type BaseListViewProps = React.PropsWithChildren<{
  storageKey: string;
  title?: string;
  errors?: string | string[];

  destructionList?: DestructionList;
  review?: Review;
  paginatedZaken: PaginatedZaken;
  secondaryNavigationItems?: ListTemplateProps["secondaryNavigationItems"];

  selectable?: boolean;
  allowSelectAllPages?: boolean;
  selectionActions?: ButtonProps[];
  initiallySelectedZakenOnPage?: Zaak[];

  extraFields?: TypedField[];
  filterSelectionZaken?: ZaakSelectionZaakFilter;
  getSelectionDetail?: ZaakSelectionDetailGetter;

  dataGridProps?: Partial<DataGridProps>;

  onClearZaakSelection?: () => void; // FIXME: REMOVE?
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

  extraFields,
  filterSelectionZaken,
  getSelectionDetail,

  dataGridProps,

  children,

  onClearZaakSelection,
}: BaseListViewProps) {
  const { state } = useNavigation();
  const [page, setPage] = usePage();
  const [, setFilterField] = useFilter();
  const [sort, setSort] = useSort();

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

  // Merge `selectedZakenOnPage`.
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
    const fixedItems =
      selectable && hasSelection
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
    return [...(selectionActions || []), ...fixedItems];
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
        selectable: selectable,
        filterable: true,
        tableLayout: "fixed",

        allowSelectAllPages,
        allPagesSelected,
        count: paginatedZaken.count,
        equalityChecker: (a, b) => a.uuid === b.uuid || a.url === b.url,
        fields,
        filterTransform,
        loading: state === "loading",
        objectList: paginatedZaken.results as unknown as AttributeData[],
        page,
        sort: sort,
        selected: selectable
          ? (selectedZakenOnPage as unknown as AttributeData[])
          : [],
        selectionActions: getSelectionActions(),

        onFieldsChange: setFields,
        onFilter: setFilterField,
        onPageChange: setPage,
        onSelect: handleSelect,
        onSelectAllPages: handleSelectAllPages,
        onSort: setSort,

        ...dataGridProps,
      }}
    >
      <DestructionListToolbar title={title} />
      {children}
    </ListTemplate>
  );
}
