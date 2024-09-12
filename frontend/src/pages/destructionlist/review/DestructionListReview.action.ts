import { ActionFunctionArgs, redirect } from "react-router-dom";

import { TypedAction } from "../../../hooks";
import {
  Review,
  ZaakReview,
  createDestructionListReview,
} from "../../../lib/api/review";
import {
  addToZaakSelection,
  clearZaakSelection,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { getDestructionListReviewKey } from "./DestructionListReview";

export type DestructionListReviewActionContext = {
  details: {
    listFeedback: string;
  };
};

export type ReviewDestructionListAction =
  | ReviewDestructionListZaakAction
  | ReviewDestructionListZakenAction
  | ReviewDestructionListListAction;

export type ReviewDestructionListZaakAction = TypedAction<
  "APPROVE_ITEM" | "EXCLUDE_ITEM",
  ReviewDestructionListZaakActionPayLoad
>;
export type ReviewDestructionListZakenAction = TypedAction<
  "APPROVE_ITEMS" | "UNSELECT_ITEMS",
  ReviewDestructionListZakenActionPayLoad
>;
export type ReviewDestructionListZaakActionPayLoad = {
  comment?: string;
  destructionList: string;
  zaak: string;
};

export type ReviewDestructionListZakenActionPayLoad = {
  destructionList: string;
  zaken: string[];
};

export type ReviewDestructionListListAction =
  | TypedAction<"APPROVE_LIST", ReviewDestructionListListApproveActionPayLoad>
  | TypedAction<"REJECT_LIST", ReviewDestructionListListRejectActionPayLoad>;

export type ReviewDestructionListListApproveActionPayLoad = {
  destructionList: string;
  comment: string;
};

export type ReviewDestructionListListRejectActionPayLoad = {
  destructionList: string;
  comment: string;
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
    case "APPROVE_ITEMS":
      return destructionListApproveItemsAction({ request, params });
    case "APPROVE_ITEM":
      return destructionListApproveItemAction({ request, params });
    case "EXCLUDE_ITEM":
      return destructionListExcludeItemAction({ request, params });
    case "UNSELECT_ITEMS":
      return destructionListUnselectItemsAction({ request, params });

    case "APPROVE_LIST":
      return destructionListApproveListAction({ request, params });
    case "REJECT_LIST":
      return destructionListRejectListAction({ request, params });
  }
};

/**
 * React Router action, user intends to approve a selection of items.
 * @param request
 * @param params
 */
export async function destructionListApproveItemsAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { destructionList, zaken } =
    payload as ReviewDestructionListZakenActionPayLoad;
  await addToZaakSelection(
    getDestructionListReviewKey(destructionList),
    zaken,
    { approved: true },
  );
  return null;
}

/**
 * React Router action, user intends to approve an item.
 * @param request
 * @param params
 */
export async function destructionListApproveItemAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { destructionList, zaak } =
    payload as ReviewDestructionListZaakActionPayLoad;
  await addToZaakSelection(
    getDestructionListReviewKey(destructionList),
    [zaak],
    { approved: true },
  );
  return null;
}

/**
 * React Router action, user intends to exclude an item.
 * @param request
 * @param params
 */
export async function destructionListExcludeItemAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { comment, destructionList, zaak } =
    payload as ReviewDestructionListZaakActionPayLoad;
  await addToZaakSelection(
    getDestructionListReviewKey(destructionList),
    [zaak],
    { approved: false, comment },
  );
  return null;
}

/**
 * React Router action, user intends to unselect a selection of items.
 * @param request
 * @param params
 */
export async function destructionListUnselectItemsAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { destructionList, zaken } =
    payload as ReviewDestructionListZakenActionPayLoad;
  await removeFromZaakSelection(
    getDestructionListReviewKey(destructionList),
    zaken,
  );
  return null;
}

/**
 * React Router action, user intends to reject a list.
 * @param request
 * @param params
 */
export async function destructionListApproveListAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { destructionList, comment } =
    payload as ReviewDestructionListListApproveActionPayLoad;

  const data: Review = {
    destructionList: destructionList,
    decision: "accepted",
    listFeedback: comment,
  };

  await Promise.all([
    await createDestructionListReview(data),
    await clearZaakSelection(getDestructionListReviewKey(destructionList)),
  ]);
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
  const { comment, destructionList, zaakReviews } =
    payload as ReviewDestructionListListRejectActionPayLoad;

  const data: Review = {
    destructionList: destructionList,
    decision: "rejected",
    listFeedback: comment,
    zakenReviews: zaakReviews,
  };

  await Promise.all([
    createDestructionListReview(data),
    clearZaakSelection(getDestructionListReviewKey(destructionList)),
  ]);
  return redirect("/");
}
