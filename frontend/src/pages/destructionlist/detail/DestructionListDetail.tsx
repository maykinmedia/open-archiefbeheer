import { CardBaseTemplate } from "@maykin-ui/admin-ui";
import React from "react";
import { useLoaderData } from "react-router-dom";

import { DestructionListDetailContext } from "./DestructionListDetail.loader";
import { DestructionListEdit } from "./components/DestructionListEdit/DestructionListEdit";
import { DestructionListProcessReview } from "./components/DestructionListProcessReview/DestructionListProcessReview";
import { DestructionListToolbar } from "./components/DestructionListToolbar/DestructionListToolbar";
import { useSecondaryNavigation } from "./hooks/useSecondaryNavigation";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { destructionList } = useLoaderData() as DestructionListDetailContext;
  const isInReview = destructionList.status === "changes_requested";

  const secondaryNavigationItems = useSecondaryNavigation();

  return (
    <CardBaseTemplate secondaryNavigationItems={secondaryNavigationItems}>
      <DestructionListToolbar />
      {isInReview ? <DestructionListProcessReview /> : <DestructionListEdit />}
    </CardBaseTemplate>
  );
}
