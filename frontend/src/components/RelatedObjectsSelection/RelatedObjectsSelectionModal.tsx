import { Badge, Button, Solid, useDialog } from "@maykin-ui/admin-ui";
import React, { useCallback } from "react";

import { User } from "../../lib/api/auth";
import { DestructionList } from "../../lib/api/destructionLists";
import { RelatedObjectsSelection } from "./RelatedObjectsSelection";

/**
 * Props for `<RelatedObjectsSelectionModal/>` component.
 */
export type ZaakObjectSelectionModalProps = {
  amount: number;
  destructionList: DestructionList;
  destructionListItemPk: number;
  user: User;
};

/**
 * Allows selecting related object instances for destruction.
 */
export const RelatedObjectsSelectionModal: React.FC<
  ZaakObjectSelectionModalProps
> = ({ amount, destructionList, destructionListItemPk, user }) => {
  const dialog = useDialog();

  const handleClick = useCallback(
    () =>
      dialog(
        "Gerelateerde objecten",
        <RelatedObjectsSelection
          destructionList={destructionList}
          destructionListItemPk={destructionListItemPk}
          user={user}
        />,
      ),
    [dialog, destructionListItemPk],
  );

  return amount ? (
    <>
      <Button
        aria-label="Toon gerelateerde objecten"
        variant="transparent"
        pad={"h"}
        onClick={handleClick}
      >
        <Badge>{amount}</Badge>
        <Solid.EyeIcon />
      </Button>
    </>
  ) : (
    amount
  );
};
