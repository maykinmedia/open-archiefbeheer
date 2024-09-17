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
  const { name, assigneeId, allPagesSelected, zaakFilters, zaakUrls } =
    payload as DestructionListCreateActionPayload;

  try {
    await createDestructionList(
      name,
      zaakUrls,
      assigneeId,
      zaakFilters,
      allPagesSelected,
    );
  } catch (e: unknown) {
    return {
      errors: collectErrors(await (e as Response).json()),
    };
  }

  await clearZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
  return redirect("/");
};

/**
 * Takes an errors object and returns a `string[]` with correct messages.
 * @param errors
 */
function collectErrors(errors: string | object): string[] {
  if (typeof errors === "string") {
    return [errors];
  }
  const flatten = Object.values(errors).flat();
  return flatten.reduce((acc, val) => [...acc, ...collectErrors(val)], []);
}
