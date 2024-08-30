import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { createDestructionList } from "../../../lib/api/destructionLists";
import {
  clearZaakSelection,
  getAllZakenSelected,
} from "../../../lib/zaakSelection/zaakSelection";
import { DESTRUCTION_LIST_CREATE_KEY } from "./DestructionListCreate";

/**
 * React Router action.
 * @param request
 */
export async function destructionListCreateAction({
  request,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const zaakUrls = formData.getAll("zaakUrls") as string[];
  const assigneeIds = formData.getAll("assigneeIds") as string[];
  const zaakFilters = formData.get("zaakFilters") as string;
  const allZakenSelected = await getAllZakenSelected(
    DESTRUCTION_LIST_CREATE_KEY,
  );

  try {
    await createDestructionList(
      name,
      zaakUrls,
      assigneeIds,
      zaakFilters,
      allZakenSelected,
    );
  } catch (e: unknown) {
    return await (e as Response).json();
  }
  await clearZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
  return redirect("/");
}
