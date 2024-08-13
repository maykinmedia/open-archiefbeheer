import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { JsonValue, TypedAction } from "../../../hooks";
import { User } from "../../../lib/api/auth";
import {
  DestructionListItemUpdate,
  destroyDestructionList,
  markDestructionListAsFinal,
  reassignDestructionList,
  updateDestructionList,
} from "../../../lib/api/destructionLists";
import {
  ReviewResponse,
  createReviewResponse,
} from "../../../lib/api/reviewResponse";

export type UpdateDestructionListAction<P = JsonValue> = TypedAction<
  | "DESTROY"
  | "MAKE_FINAL"
  | "PROCESS_REVIEW"
  | "UPDATE_ASSIGNEES"
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
    case "UPDATE_ASSIGNEES":
      return await destructionListUpdateAssigneesAction({ request, params });
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

/**
 * React Router action (user intents to adds/remove zaken to/from the destruction list).
 */
export async function destructionListProcessReviewAction({
  request,
}: ActionFunctionArgs) {
  const data = await request.json();
  const reviewResponse: ReviewResponse = data.payload;

  try {
    await createReviewResponse(reviewResponse);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}

export type DestructionListUpdateAssigneesActionPayload =
  UpdateDestructionListAction<{
    assignees: { user: User["pk"] }[];
    comment: string;
  }>;

/**
 * React Router action (user intents to reassign the destruction list).
 */
export async function destructionListUpdateAssigneesAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data: DestructionListUpdateAssigneesActionPayload =
    await request.json();
  const { assignees, comment } = data.payload;

  const _assignees = assignees.filter((assignee) => Boolean(assignee?.user)); // Case in which a reviewer is removed

  try {
    await reassignDestructionList(params.uuid as string, {
      assignees: _assignees,
      comment: comment,
      role: "reviewer",
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
