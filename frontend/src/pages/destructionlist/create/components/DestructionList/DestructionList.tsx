import { DataGridProps, ListTemplate } from "@maykin-ui/admin-ui";
import { useActionData, useLoaderData, useNavigation } from "react-router-dom";

import { PaginatedZaken } from "../../../../../lib/api/zaken";
import { Zaak } from "../../../../../types";
import {
  DataGridAction,
  useDataGridProps,
} from "../../../hooks/useDataGridProps";
import { DestructionListReviewContext } from "../../../review";

export type DestructionList = React.PropsWithChildren<
  {
    errors?: string | string[];
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
  errors,
  storageKey,
  zaken,
  selectedZaken,
  title,
  labelAction = title,
  onSubmitSelection,
  actions,
  ...props
}: DestructionList) {
  const { state } = useNavigation();
  const actionErrors = useActionData() || {};
  const { uuid: destructionListUuid } =
    useLoaderData() as DestructionListReviewContext;
  const { props: dataGridProps, error } = useDataGridProps(
    storageKey,
    zaken,
    selectedZaken,
    actions,
    destructionListUuid,
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
            disabled: ["loading", "submitting"].includes(state),
            variant: "primary",
            wrap: false,
            onClick: onSubmitSelection,
          },
        ],
      }}
    >
      {children}
    </ListTemplate>
  );
}
