import { ActionFunctionArgs } from "react-router-dom";

import { JsonValue, TypedAction } from "../../hooks";
import {
  ArchiveConfiguration,
  patchArchiveConfiguration,
} from "../../lib/api/config";

export type UpdateSettingsAction<T = JsonValue> = TypedAction<
  "PATCH-ARCHIVE-CONFIG",
  T
>;

/**
 * React Router action.
 */
export async function settingsAction({ request, params }: ActionFunctionArgs) {
  const data = await request.clone().json();
  const action = data as UpdateSettingsAction<unknown>;

  switch (action.type) {
    case "PATCH-ARCHIVE-CONFIG":
      return await patchArchiveConfigAction({ request, params });
    default:
      throw new Error("INVALID ACTION TYPE SPECIFIED!");
  }
}

async function patchArchiveConfigAction({ request }: ActionFunctionArgs) {
  const abortController = new AbortController();
  const { payload } = await request.json();
  const _payload = payload as ArchiveConfiguration;

  try {
    await patchArchiveConfiguration(_payload, abortController.signal);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return null;
}
