import {
  AttributeData,
  DataGridProps,
  ListTemplate,
  TypedField,
  formatMessage,
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
import { getFields } from "../../pages/destructionlist/utils";
import { Zaak } from "../../types";

export type DestructionList = {
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  onSubmitSelection: () => void;
  zaaktypeChoices: ZaaktypeChoice[];
  // TODO: Here we could implement a simple API to specifiy what fields to show in the list.
  storageKey: string;
};

/** The template used to format urls to an external application providing zaak details. */
const REACT_APP_ZAAK_URL_TEMPLATE = process.env.REACT_APP_ZAAK_URL_TEMPLATE;

/**
 * Review-destruction-list page
 */
export function DestructionList({
  zaken,
  onSubmitSelection,
  selectedZaken,
  zaaktypeChoices,
  storageKey,
}: DestructionList) {
  const errors = useActionData() || {};

  const [searchParams, setSearchParams] = useSearchParams();
  const objectList = zaken.results.map((zaak) => ({
    ...zaak,
    href: formatMessage(REACT_APP_ZAAK_URL_TEMPLATE || "", zaak),
  })) as unknown as AttributeData[];
  const { state } = useNavigation();

  const [fieldSelectionState, setFieldSelectionState] =
    useState<FieldSelection>();

  useEffect(() => {
    getFieldSelection(storageKey).then((fieldSelection) =>
      setFieldSelectionState(fieldSelection),
    );
  }, []);

  let fields = getFields(searchParams, zaaktypeChoices);
  fields = fields.map((field) => {
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
      Object.entries(combinedParams).filter((keyValuePair) => keyValuePair[1]),
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
      ? await addToZaakSelection(storageKey, attributeData as unknown as Zaak[])
      : await removeFromZaakSelection(
          storageKey,
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
          aProps: {
            target: "_blank",
          },
          count: zaken.count,
          equalityChecker: (a, b) => a.uuid === b.uuid,
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
          title: "Vernietigingslijst opstellen",
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
