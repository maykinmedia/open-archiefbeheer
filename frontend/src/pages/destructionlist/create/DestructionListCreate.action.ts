import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { TypedAction } from "../../../hooks";
import { createDestructionList } from "../../../lib/api/destructionLists";
import { cacheDelete } from "../../../lib/cache/cache";
import {
  clearZaakSelection,
  getAllZakenSelected,
  getFilteredZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { DESTRUCTION_LIST_CREATE_KEY } from "./DestructionListCreate";

export type DestructionListCreateAction = TypedAction<
  "CREATE_LIST",
  DestructionListCreateActionPayload
>;

export type DestructionListCreateActionPayload = {
  name: string;
  assigneeId: string;
  comment?: string;
  zaakFilters: string;
};

export type DestructionListCreateActionResponseData = {
  errors?: string[];
};

/**
 * React Router action.
 * @param request
 * @param params
 */
export const destructionListCreateAction = async ({
  request,
}: ActionFunctionArgs): Promise<
  Response | DestructionListCreateActionResponseData
> => {
  const abortController = new AbortController();
  const { payload } = await request.json();
  const { name, assigneeId, comment, zaakFilters } =
    payload as DestructionListCreateActionPayload;

  const key = DESTRUCTION_LIST_CREATE_KEY;
  const allPagesSelected = await getAllZakenSelected(key);
  const zaakUrls = Object.keys(await getFilteredZaakSelection(key));

  try {
    await createDestructionList(
      name,
      zaakUrls,
      assigneeId,
      zaakFilters,
      allPagesSelected,
      comment,
      abortController.signal,
    );
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }

  await clearZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
  await cacheDelete("list", true); // Remove possibly outdated cached value of list API's for choices.
  return redirect("/");
};
