import {
  AttributeData,
  ButtonProps,
  DataGridProps,
  ListTemplate,
  ListTemplateProps,
  Solid,
  TypedField,
} from "@maykin-ui/admin-ui";
import React, { useCallback } from "react";
import { useNavigation } from "react-router-dom";

import { DestructionList } from "../../../lib/api/destructionLists";
import { Review } from "../../../lib/api/review";
import { PaginatedZaken } from "../../../lib/api/zaken";
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

  allowSelectAllPages?: boolean;
  selectionActions?: ButtonProps[];

  extraFields?: TypedField[];
  filterSelectionZaken?: ZaakSelectionZaakFilter;
  getSelectionDetail?: ZaakSelectionDetailGetter;

  dataGridProps?: Partial<DataGridProps>;
}>;

export function BaseListView({
  storageKey,
  title,
  errors,

  destructionList,
  review,
  paginatedZaken,
  secondaryNavigationItems,

  allowSelectAllPages,
  selectionActions,

  extraFields,
  filterSelectionZaken,
  getSelectionDetail,

  dataGridProps,

  children,
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
    selectedZakenOnPage,
    handleSelect,
    {
      hasSelection,
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

  // Selection actions.
  const getSelectionActions = useCallback(() => {
    const fixedItems = hasSelection
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
            onClick: clearZaakSelection,
          },
        ] as ButtonProps[])
      : [];
    return [...(selectionActions || []), ...fixedItems];
  }, [hasSelection, selectedZakenOnPage, selectionActions]);

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
        selectable: true,
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
        selected: selectedZakenOnPage as unknown as AttributeData[],
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
