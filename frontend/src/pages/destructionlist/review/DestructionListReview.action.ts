import { ActionFunctionArgs, redirect } from "react-router-dom";

import { TypedAction } from "../../../hooks";
import { CoReview, createCoReview } from "../../../lib/api/coReview";
import {
  Review,
  ZaakReview,
  createDestructionListReview,
} from "../../../lib/api/review";
import { RestBackend } from "../../../lib/zaakSelection";
import { clearZaakSelection } from "../../../lib/zaakSelection";
import { getDestructionListReviewKey } from "./DestructionListReview";

export type DestructionListReviewActionContext = {
  details: {
    listFeedback: string;
  };
};

export type ReviewDestructionListAction =
  | TypedAction<"APPROVE_LIST", ReviewDestructionListApproveActionPayLoad>
  | TypedAction<"REJECT_LIST", ReviewDestructionListRejectActionPayLoad>
  | TypedAction<
      "COMPLETE_CO_REVIEW",
      ReviewDestructionListCompleteCoReviewPayload
    >;

export type ReviewDestructionListApproveActionPayLoad = {
  comment: string;
  destructionList: string;
  status: string;
};

export type ReviewDestructionListRejectActionPayLoad = {
  comment: string;
  destructionList: string;
  status: string;
  zaakReviews?: ZaakReview[];
};

export type ReviewDestructionListCompleteCoReviewPayload = {
  comment: string;
  destructionList: string;
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
  const data = await request.clone().json();
  const action = data as ReviewDestructionListAction;

  switch (action.type) {
    case "APPROVE_LIST":
      return destructionListApproveListAction({ request, params });
    case "REJECT_LIST":
      return destructionListRejectListAction({ request, params });
    case "COMPLETE_CO_REVIEW":
      return destructionListCompleteCoReviewAction({ request, params });
  }
};

/**
 * React Router action, user intends to reject a list.
 * @param request
 * @param params
 */
export async function destructionListApproveListAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { comment, destructionList, status } =
    payload as ReviewDestructionListApproveActionPayLoad;

  const data: Review = {
    destructionList: destructionList,
    decision: "accepted",
    listFeedback: comment,
  };

  try {
    await Promise.all([
      await createDestructionListReview(data),
      // The selection is cleared to prevent clashes, since the backend
      // can pre-populate it for future reviews (see github issue #498).
      await clearZaakSelection(
        getDestructionListReviewKey(destructionList, status),
        RestBackend,
      ),
    ]);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}

/**
 * React Router action, user intends to reject a list.
 * @param request
 * @param params
 */
export async function destructionListRejectListAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { comment, destructionList, status, zaakReviews } =
    payload as ReviewDestructionListRejectActionPayLoad;

  const data: Review = {
    destructionList: destructionList,
    decision: "rejected",
    listFeedback: comment,
    zakenReviews: zaakReviews,
  };

  try {
    await Promise.all([
      createDestructionListReview(data),
      // The selection is cleared to prevent clashes, since the backend
      // can pre-populate it for future reviews (see github issue #498).
      clearZaakSelection(
        getDestructionListReviewKey(destructionList, status),
        RestBackend,
      ),
    ]);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}

/**
 * React Router action, user intends to complete a co-review.
 * @param request
 * @param params
 */
export async function destructionListCompleteCoReviewAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { comment, destructionList } =
    payload as ReviewDestructionListCompleteCoReviewPayload;

  const data: CoReview = {
    destructionList: destructionList,
    listFeedback: comment,
  };

  try {
    await createCoReview(data);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}
