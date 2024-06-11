import { ListTemplate } from "@maykin-ui/admin-ui";
import { useActionData } from "react-router-dom";

import { PaginatedZaken } from "../../lib/api/zaken";
import { useDataGridProps } from "../../pages/destructionlist/hooks";
import { Zaak } from "../../types";

export type DestructionList = {
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  onSubmitSelection: () => void;
  // TODO: Here we could implement a simple API to specifiy what fields to show in the list.
  storageKey: string;
  title: string;
};

/**
 * Review-destruction-list page
 */
export function DestructionList({
  storageKey,
  zaken,
  selectedZaken,
  title,
  onSubmitSelection,
}: DestructionList) {
  const errors = useActionData() || {};
  const { props: dataGridProps, error } = useDataGridProps(
    storageKey,
    zaken,
    selectedZaken,
  );
  const _errors = [...Object.values(errors), error].filter((v) => v);

  return (
    <ListTemplate
      errors={_errors}
      dataGridProps={{
        ...dataGridProps,
        title,
        selectionActions: [
          {
            children: title,
            onClick: onSubmitSelection,
            wrap: false,
          },
        ],
      }}
    />
  );
}
