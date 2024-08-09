import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { createDestructionList } from "../../../lib/api/destructionLists";
import { getSessionHash } from "../../../lib/hash/hash";
import { clearZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import { DEFAULT_STORAGE_KEY } from "./DestructionListCreate";

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
  const sessionHash = await getSessionHash();

  try {
    await createDestructionList(name, zaakUrls, assigneeIds);
  } catch (e: unknown) {
    return await (e as Response).json();
  }

  await clearZaakSelection(
    sessionHash || DEFAULT_STORAGE_KEY, // Todo: investigate token mechanism from server to allow cross-device selection and get rid of DEFAULT_STORAGE_KEY.
    Boolean(sessionHash),
  );
  return redirect("/");
}
