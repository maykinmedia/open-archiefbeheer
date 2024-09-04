import { ActionFunctionArgs, redirect } from "react-router-dom";

import { JsonValue, TypedAction } from "../../../hooks";
import { Review, createDestructionListReview } from "../../../lib/api/review";
import {
  ZaakSelection,
  addToZaakSelection,
  getZaakSelection,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { UpdateDestructionListAction } from "../detail";
import {
  FormDataState,
  getDestructionListReviewKey,
} from "./DestructionListReview";

export type DestructionListReviewActionContext = {
  details: {
    listFeedback: string;
  };
};

export type ReviewDestructionListAction =
  | ReviewDestructionListZaakAction
  | ReviewDestructionListZakenAction;

export type ReviewDestructionListZaakAction<
  P = ReviewDestructionListZaakActionPayLoad,
> = TypedAction<"APPROVE_ITEM" | "EXCLUDE_ITEM", P>;

export type ReviewDestructionListZaakActionPayLoad = {
  destructionList: string;
  zaak: string;
};

export type ReviewDestructionListZakenAction<
  P = ReviewDestructionListZakenActionPayLoad,
> = TypedAction<"APPROVE_ITEMS" | "UNSELECT_ITEMS", P>;

export type ReviewDestructionListZakenActionPayLoad = {
  destructionList: string;
  zaken: string[];
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
  }

  // const details =
  //   (await request.json()) as DestructionListReviewActionContext["details"];
  // const destructionListUuid = params.uuid;
  //
  // if (!destructionListUuid) {
  //   throw new Error("No uuid provided");
  // }
  //
  // const storageKey = getDestructionListReviewKey(destructionListUuid as string);
  // const searchParams = new URLSearchParams();
  // searchParams.set("destruction_list", destructionListUuid);
  //
  // // Get data
  // const promises = [getZaakSelection(storageKey)];
  //
  // const [zaakSelection] = (await Promise.all(promises)) as [ZaakSelection];
  //
  // const zaakSelectionValid = Object.values(zaakSelection).filter(
  //   (f) => f.selected,
  // );
  //
  // const data: Review = {
  //   destructionList: destructionListUuid,
  //   decision: zaakSelectionValid.length > 0 ? "rejected" : "accepted",
  //   listFeedback: details.listFeedback,
  //   zakenReviews: zaakSelectionValid.map((zaak) => {
  //     if (!zaak.detail) {
  //       throw new Error("Details are missing for one or more zaken");
  //     }
  //     const detail = zaak.detail as FormDataState;
  //
  //     return {
  //       zaakUrl: detail.url,
  //       feedback: detail.motivation,
  //     };
  //   }),
  // };
  // await createDestructionListReview(data);
  // return redirect("/");
};

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

export async function destructionListExcludeItemAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  const { destructionList, zaak } =
    payload as ReviewDestructionListZaakActionPayLoad;
  await addToZaakSelection(
    getDestructionListReviewKey(destructionList),
    [zaak],
    { approved: false },
  );
  return null;
}

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
