import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { JsonValue, TypedAction } from "../../../hooks";
import { User } from "../../../lib/api/auth";
import {
  DestructionListItemUpdate,
  destroyDestructionList,
  markDestructionListAsFinal,
  markDestructionListAsReadyToReview,
  reassignDestructionList,
  updateDestructionList,
} from "../../../lib/api/destructionLists";
import {
  ReviewResponse,
  createReviewResponse,
} from "../../../lib/api/reviewResponse";
import { clearZaakSelection } from "../../../lib/zaakSelection/zaakSelection";

export type UpdateDestructionListAction<P = JsonValue> = TypedAction<
  | "DESTROY"
  | "MAKE_FINAL"
  | "PROCESS_REVIEW"
  | "READY_TO_REVIEW"
  | "UPDATE_REVIEWER"
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
    case "DESTROY":
      return await destructionListDestroyAction({ request, params });
    case "MAKE_FINAL":
      return await destructionListMakeFinalAction({ request, params });
    case "PROCESS_REVIEW":
      return await destructionListProcessReviewAction({ request, params });
    case "READY_TO_REVIEW":
      return await destructionListProcessReadyToReviewAction({
        request,
        params,
      });
    case "UPDATE_REVIEWER":
      return await destructionListUpdateReviewerAction({ request, params });
    case "UPDATE_ZAKEN":
      return await destructionListUpdateZakenAction({ request, params });
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
export async function destructionListDestroyAction({
  request,
}: ActionFunctionArgs) {
  const { payload } = await request.json();
  await destroyDestructionList(payload.uuid);
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
  markDestructionListAsReadyToReview(payload.uuid);
  return redirect("/");
}

export type DestructionListUpdateReviewerActionPayload =
  UpdateDestructionListAction<{
    assignee: { user: User["pk"] };
    comment: string;
  }>;

/**
 * React Router action (user intents to reassign the destruction list).
 */
export async function destructionListUpdateReviewerAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data: DestructionListUpdateReviewerActionPayload = await request.json();
  const { assignee, comment } = data.payload;

  try {
    await reassignDestructionList(params.uuid as string, {
      assignee: assignee,
      comment: comment,
    });
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect(`/destruction-lists/${params.uuid}/`);
}

/**
 * React Router action (user intents to adds/remove zaken to/from the destruction list).
 */
export async function destructionListUpdateZakenAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data: UpdateDestructionListAction<Record<string, string[]>> =
    await request.json();
  const { zaakUrls } = data.payload;

  const items = zaakUrls.map((zaakUrl) => ({
    zaak: zaakUrl,
  })) as DestructionListItemUpdate[];

  try {
    await updateDestructionList(params.uuid as string, { items });
  } catch (e: unknown) {
    if (e instanceof Response) return await (e as Response).json();

    throw e;
  }

  return redirect(`/destruction-lists/${params.uuid}/`);
}
