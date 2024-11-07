import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { TypedAction } from "../../../hooks";
import { createDestructionList } from "../../../lib/api/destructionLists";
import { clearZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import { DESTRUCTION_LIST_CREATE_KEY } from "./DestructionListCreate";

export type DestructionListCreateAction = TypedAction<
  "CREATE_LIST",
  DestructionListCreateActionPayload
>;

export type DestructionListCreateActionPayload = {
  name: string;
  zaakUrls: string[];
  assigneeId: string;
  comment?: string;
  zaakFilters: string;
  allPagesSelected: boolean;
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
  const { payload } = await request.json();
  const { name, assigneeId, comment, allPagesSelected, zaakFilters, zaakUrls } =
    payload as DestructionListCreateActionPayload;

  try {
    await createDestructionList(
      name,
      zaakUrls,
      assigneeId,
      zaakFilters,
      allPagesSelected,
      comment,
    );
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }

  await clearZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
  return redirect("/");
};
