import { DataGridProps, ListTemplate } from "@maykin-ui/admin-ui";
import { useActionData } from "react-router-dom";

import { PaginatedZaken } from "../../../../../lib/api/zaken";
import { Zaak } from "../../../../../types";
import {
  DataGridAction,
  useDataGridProps,
} from "../../../hooks/useDataGridProps";

export type DestructionList = React.PropsWithChildren<
  {
    zaken: PaginatedZaken;
    selectedZaken: Zaak[];
    onSubmitSelection: () => void;
    // TODO: Here we could implement a simple API to specifiy what fields to show in the list.
    storageKey: string;
    title: string;
    labelAction?: string;
    actions?: DataGridAction[];
  } & Omit<DataGridProps, "objectList">
>;

/**
 * Review-destruction-list page
 */
export function DestructionList({
  children,
  storageKey,
  zaken,
  selectedZaken,
  title,
  labelAction = title,
  onSubmitSelection,
  actions,
  ...props
}: DestructionList) {
  const errors = useActionData() || {};
  const { props: dataGridProps, error } = useDataGridProps(
    storageKey,
    zaken,
    selectedZaken,
    actions,
  );
  const _errors = [...Object.values(errors), error].filter((v) => v);

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
            onClick: onSubmitSelection,
            wrap: false,
            variant: "primary",
          },
        ],
      }}
    >
      {children}
    </ListTemplate>
  );
}
