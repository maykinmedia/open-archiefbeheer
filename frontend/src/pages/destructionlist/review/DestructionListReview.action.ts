import { ActionFunctionArgs, redirect } from "react-router-dom";

import { Review, createDestructionListReview } from "../../../lib/api/review";
import {
  ZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import {
  FormDataState,
  getDestructionListReviewKey,
} from "./DestructionListReview";

export type DestructionListReviewActionContext = {
  details: {
    listFeedback: string;
  };
};

/**
 * React Router action.
 * @param request
 * @param params
 */
export const destructionListReviewAction = async ({
  request,
  params,
}: ActionFunctionArgs<DestructionListReviewActionContext>) => {
  const details =
    (await request.json()) as DestructionListReviewActionContext["details"];
  const destructionListUuid = params.uuid;

  if (!destructionListUuid) {
    throw new Error("No uuid provided");
  }

  const storageKey = getDestructionListReviewKey(destructionListUuid as string);
  const searchParams = new URLSearchParams();
  searchParams.set("destruction_list", destructionListUuid);

  // Get data
  const promises = [getZaakSelection(storageKey)];

  const [zaakSelection] = (await Promise.all(promises)) as [ZaakSelection];

  const zaakSelectionValid = Object.values(zaakSelection).filter(
    (f) => f.selected,
  );

  const data: Review = {
    destructionList: destructionListUuid,
    decision: zaakSelectionValid.length > 0 ? "rejected" : "accepted",
    listFeedback: details.listFeedback,
    zakenReviews: zaakSelectionValid.map((zaak) => {
      if (!zaak.detail) {
        throw new Error("Details are missing for one or more zaken");
      }
      const detail = zaak.detail as FormDataState;

      return {
        zaakUrl: detail.url,
        feedback: detail.motivation,
      };
    }),
  };
  await createDestructionListReview(data);
  return redirect("/");
};
