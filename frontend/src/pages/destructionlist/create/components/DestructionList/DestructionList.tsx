import { DataGridProps, ListTemplate } from "@maykin-ui/admin-ui";
import React from "react";
import { useActionData, useLoaderData, useNavigation } from "react-router-dom";

import { PaginatedZaken } from "../../../../../lib/api/zaken";
import { ZaakSelection } from "../../../../../lib/zaakSelection/zaakSelection";
import {
  DataGridAction,
  useDataGridProps,
} from "../../../hooks/useDataGridProps";
import { DestructionListReviewContext } from "../../../review";

export type DestructionList = React.PropsWithChildren<
  {
    errors?: string | string[];
    zaken: PaginatedZaken;
    zaakSelection: ZaakSelection;
    allZakenSelected?: boolean;
    onSubmitSelection: () => void;
    // TODO: Here we could implement a simple API to specifiy what fields to show in the list.
    storageKey: string;
    title: string;
    labelAction?: React.ReactNode;
    primaryActionDisabled?: boolean;
    actions?: DataGridAction[];
    onClearSelection?: () => void | Promise<void>;
  } & Omit<DataGridProps, "objectList">
>;

/**
 * Review-destruction-list page
 */
export function DestructionList({
  children,
  errors,
  storageKey,
  zaken,
  zaakSelection,
  allZakenSelected,
  title,
  labelAction = title,
  onSubmitSelection,
  primaryActionDisabled,
  actions,
  onClearSelection,
  ...props
}: DestructionList) {
  const { state } = useNavigation();
  const actionErrors = useActionData() || {};
  const { uuid: destructionListUuid } =
    useLoaderData() as DestructionListReviewContext;
  const { props: dataGridProps, error } = useDataGridProps(
    storageKey,
    zaken,
    zaakSelection,
    allZakenSelected,
    actions,
    destructionListUuid,
    undefined,
    onClearSelection,
  );
  const _errors =
    errors || [...Object.values(actionErrors), error].filter((v) => v);

  return (
    <ListTemplate
      errors={_errors}
      dataGridProps={{
        ...dataGridProps,
        ...props,
        title,
        selectionActions: [
          {
            children: labelAction,
            disabled:
              primaryActionDisabled ||
              ["loading", "submitting"].includes(state),
            variant: "primary",
            wrap: false,
            onClick: onSubmitSelection,
          },
          ...(dataGridProps.selectionActions || []),
        ],
      }}
    >
      {children}
    </ListTemplate>
  );
}
