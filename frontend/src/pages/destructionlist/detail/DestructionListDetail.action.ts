import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { TypedAction } from "../../../hooks";
import {
  DestructionListItemUpdate,
  updateDestructionList,
} from "../../../lib/api/destructionLists";
import {
  ReviewResponse,
  createReviewResponse,
} from "../../../lib/api/reviewResponse";

export type UpdateDestructionListAction<T> = TypedAction<
  "PROCESS_REVIEW" | "UPDATE_ASSIGNEES" | "UPDATE_ZAKEN",
  T
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

/**
 * React Router action (user intents to reassign the destruction list).
 */
export async function destructionListUpdateAssigneesAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data: UpdateDestructionListAction<
    Record<string, string | Array<number | string>>
  > = await request.json();
  const { assigneeIds, comment } = data.payload;

  const assignees = (assigneeIds as Array<number | string>)
    .filter((id) => id !== "") // Case in which a reviewer is removed
    .map((id, index) => ({
      user: Number(id),
      order: index,
    }));

  try {
    await updateDestructionList(params.uuid as string, {
      assignees,
      comment: String(comment),
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
