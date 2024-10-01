import React from "react";
import { useLoaderData } from "react-router-dom";

import { DestructionListDetailContext } from "./DestructionListDetail.loader";
import { DestructionListEdit } from "./components/DestructionListEdit/DestructionListEdit";
import { DestructionListProcessReview } from "./components/DestructionListProcessReview/DestructionListProcessReview";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { destructionList } = useLoaderData() as DestructionListDetailContext;
  const isInReview = destructionList.status === "changes_requested";

  // TODO: SEPARATE ROUTES?
  if (!isInReview) {
    return <DestructionListEdit />;
  } else {
    return <DestructionListProcessReview />;
  }
}
