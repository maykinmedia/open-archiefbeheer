import { Badge, Body, Button, Modal, Solid } from "@maykin-ui/admin-ui";
import React, { useCallback, useEffect, useState } from "react";

import { User } from "../../lib/api/auth";
import { DestructionList } from "../../lib/api/destructionLists";
import { DestructionListItem } from "../../lib/api/destructionListsItem";
import { RelatedObjectsSelection } from "./RelatedObjectsSelection";

/**
 * Props for `<RelatedObjectsSelectionModal/>` component.
 */
export type ZaakObjectSelectionModalProps = {
  destructionList: DestructionList;
  destructionListItem: DestructionListItem;
  user: User;
};

/**
 * Allows selecting related object instances for destruction.
 */
export const RelatedObjectsSelectionModal: React.FC<
  ZaakObjectSelectionModalProps
> = ({ destructionList, destructionListItem, user }) => {
  // The related count can be disable by a feature flag, in which `supportedRelatedObjectsCount`
  // will be set to null.
  //
  // Detect it and if so, disable stats.
  const FEATURE_RELATED_COUNT_DISABLED =
    destructionListItem.supportedRelatedObjectsCount === null;

  const [destructionListItemState, setDestructionListItemState] =
    useState(destructionListItem);
  useEffect(() => {
    setDestructionListItemState(destructionListItem);
  }, [destructionListItem]);

  const [modalOpenState, setModalOpenState] = useState(false);

  const handleOpen = () => setModalOpenState(true);
  const handleClose = () => setModalOpenState(false);

  const handleChange = useCallback(
    (selectedRelatedObjectsCount: number) => {
      setDestructionListItemState({
        ...destructionListItemState,
        selectedRelatedObjectsCount,
      });
      setModalOpenState(false);
    },
    [destructionListItem],
  );

  return (
    <>
      <Button
        aria-label="Toon gerelateerde objecten"
        variant="transparent"
        pad={"h"}
        onClick={handleOpen}
      >
        {!FEATURE_RELATED_COUNT_DISABLED && (
          <Badge>
            {destructionListItemState.selectedRelatedObjectsCount} /{" "}
            {destructionListItemState.supportedRelatedObjectsCount}
          </Badge>
        )}
        <Solid.EyeIcon />
      </Button>
      <Modal
        title="Gerelateerde objecten"
        open={modalOpenState}
        size={"m"}
        onClose={handleClose}
      >
        <Body>
          {modalOpenState && (
            <RelatedObjectsSelection
              destructionList={destructionList}
              destructionListItem={destructionListItemState}
              user={user}
              onChange={handleChange}
            />
          )}
        </Body>
      </Modal>
    </>
  );
};
