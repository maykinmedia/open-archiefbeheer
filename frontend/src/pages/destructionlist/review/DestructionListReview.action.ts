import { ActionFunctionArgs, redirect } from "react-router-dom";

import { TypedAction } from "../../../hooks";
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
  | TypedAction<"APPROVE_LIST", ReviewDestructionListListApproveActionPayLoad>
  | TypedAction<"REJECT_LIST", ReviewDestructionListListRejectActionPayLoad>;

export type ReviewDestructionListListApproveActionPayLoad = {
  comment: string;
  destructionList: string;
  status: string;
};

export type ReviewDestructionListListRejectActionPayLoad = {
  comment: string;
  destructionList: string;
  status: string;
  zaakReviews?: ZaakReview[];
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
    payload as ReviewDestructionListListApproveActionPayLoad;

  const data: Review = {
    destructionList: destructionList,
    decision: "accepted",
    listFeedback: comment,
  };

  try {
    await Promise.all([
      await createDestructionListReview(data),
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
    payload as ReviewDestructionListListRejectActionPayLoad;

  const data: Review = {
    destructionList: destructionList,
    decision: "rejected",
    listFeedback: comment,
    zakenReviews: zaakReviews,
  };

  try {
    await Promise.all([
      createDestructionListReview(data),
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
