import { ActionFunctionArgs } from "react-router-dom";

import { JsonValue, TypedAction } from "../../hooks";
import {
  PatchArchiveConfigPayload,
  patchArchiveConfig,
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
  const { payload } = await request.json();
  const _payload = payload as PatchArchiveConfigPayload;
  await patchArchiveConfig(_payload);
  return null;
}