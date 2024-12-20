import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { JsonValue, TypedAction } from "../../../hooks";
import {
  abort,
  destructionListQueueDestruction,
  markDestructionListAsFinal,
  markDestructionListAsReadyToReview,
  updateDestructionList,
} from "../../../lib/api/destructionLists";
import {
  ReviewResponse,
  createReviewResponse,
} from "../../../lib/api/reviewResponse";
import { clearZaakSelection } from "../../../lib/zaakSelection/zaakSelection";

export type UpdateDestructionListAction<P = JsonValue> = TypedAction<
  | "QUEUE_DESTRUCTION"
  | "CANCEL_DESTROY"
  | "MAKE_FINAL"
  | "PROCESS_REVIEW"
  | "READY_TO_REVIEW"
  | "UPDATE_ZAKEN",
  P
>;

/**
 * React Router action.
 */
export async function destructionListUpdateAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data = await request.clone().json();
  const action = data as UpdateDestructionListAction<unknown>;

  switch (action.type) {
    case "QUEUE_DESTRUCTION":
      return await destructionListQueueDestructionAction({ request, params });
    case "MAKE_FINAL":
      return await destructionListMakeFinalAction({ request, params });
    case "PROCESS_REVIEW":
      return await destructionListProcessReviewAction({ request, params });
    case "READY_TO_REVIEW":
      return await destructionListProcessReadyToReviewAction({
        request,
        params,
      });
    case "UPDATE_ZAKEN":
      return await destructionListUpdateZakenAction({ request, params });
    case "CANCEL_DESTROY":
      return await destructionListCancelDestroyAction({ request, params });
    default:
      throw new Error("INVALID ACTION TYPE SPECIFIED!");
  }
}

/**
 * React Router action (user intents to mark the destruction list as final (assign to archivist)).
 */
export async function destructionListMakeFinalAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  await markDestructionListAsFinal(payload.uuid, {
    user: payload.user,
    comment: payload.comment,
  });
  return redirect("/");
}

/**
 * React Router action (user intents to DESTROY ALL ZAKEN ON THE DESTRUCTION LIST!).
 */
export async function destructionListQueueDestructionAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  try {
    await destructionListQueueDestruction(payload.uuid);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}

export type UpdateDestructionListProcessReviewAction = TypedAction<
  "PROCESS_REVIEW",
  UpdateDestructionListProcessReviewActionPayload
>;

export type UpdateDestructionListProcessReviewActionPayload = {
  storageKey: string;
  reviewResponse: ReviewResponse;
};

/**
 * React Router action (user intents to adds/remove zaken to/from the destruction list).
 */
export async function destructionListProcessReviewAction({
  request,
}: ActionFunctionArgs) {
  const data = await request.json();
  const { storageKey, reviewResponse } =
    data.payload as UpdateDestructionListProcessReviewActionPayload;

  try {
    await createReviewResponse(reviewResponse);
    await clearZaakSelection(storageKey);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}

/**
 * React Router action (user intents to mark destruction list as ready to review).
 */
export async function destructionListProcessReadyToReviewAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  try {
    await markDestructionListAsReadyToReview(payload.uuid);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}

export type DestructionListUpdateZakenActionPayload = {
  storageKey: string;
  add: string[];
  remove: string[];
};

/**
 * React Router action (user intents to adds/remove zaken to/from the destruction list).
 */
export async function destructionListUpdateZakenAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data: UpdateDestructionListAction<DestructionListUpdateZakenActionPayload> =
    await request.json();
  const { storageKey, add: _add, remove: _remove } = data.payload;
  const add = _add.map((url) => ({ zaak: url }));
  const remove = _remove.map((url) => ({ zaak: url }));

  try {
    await updateDestructionList(params.uuid as string, { add, remove });
  } catch (e: unknown) {
    if (e instanceof Response) return await (e as Response).json();

    throw e;
  }
  await clearZaakSelection(storageKey);
  return redirect(`/destruction-lists/${params.uuid}`);
}

export async function destructionListCancelDestroyAction({
  request,
}: ActionFunctionArgs) {
  const data = await request.json();
  const { payload } = data as UpdateDestructionListAction<{
    uuid: string;
    comment: string;
  }>;
  const { comment, uuid } = payload;
  await abort(uuid, { comment });
  return redirect(`/destruction-lists/${uuid}`);
}
