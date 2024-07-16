import { Zaak } from "../../types";
import { User } from "./auth";
import { request } from "./request";

export type ZaakSelection<DetailType = unknown> = {
  key: string;
  lastUpdated: string;
  lastUpdatedBy: User;
  items: ZaakSelectionItem<DetailType>[];
};

export type ZaakSelectionItem<DetailType = unknown> = {
  zaak: Zaak["url"];
  selected: boolean;
  detail: DetailType;
};

/**
 * Adds zaken to zaak selection.
 */
export async function getRemoteZaakSelection<DetailType = unknown>(
  key: string,
  params?: URLSearchParams,
) {
  const response = await request("GET", `/zaak-selection/${key}/`, params);
  const remoteZaakSelection: ZaakSelection<DetailType> = await response.json();
  return remoteZaakSelection;
}

/**
 * Adds zaken to zaak selection.
 */
export async function addToRemoteZaakSelection(
  key: string,
  zaken: string[],
  detail: unknown = null,
  params?: URLSearchParams,
) {
  return await request("PUT", `/zaak-selection/${key}/add_zaken/`, params, {
    zaken,
    detail,
  });
}

/**
 * Removes zaken from zaak selection.
 */
export async function removeFromRemoteZaakSelection(
  key: string,
  zaken: string[],
  params?: URLSearchParams,
) {
  return await request(
    "DELETE",
    `/zaak-selection/${key}/remove_zaken/`,
    params,
    { zaken },
  );
}

/**
 * Removes zaken from zaak selection.
 */
export async function clearRemoteZaakSelection(
  key: string,
  params?: URLSearchParams,
) {
  return await request("DELETE", `/zaak-selection/${key}/clear_zaken/`, params);
}
