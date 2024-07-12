import { Zaak } from "../../types";
import { ZaakSelection } from "../zaakSelection/zaakSelection";
import { User } from "./auth";
import { request } from "./request";

export type ZaakSelectionAPIResponse = {
  key: string;
  lastUpdated: string;
  lastUpdatedBy: User;
  items: [
    {
      zaak: Zaak["url"];
      selected: boolean;
      detail: unknown;
    },
  ];
};

/**
 * Adds zaken to zaak selection.
 */
export async function getRemoteZaakSelection(
  key: string,
  params?: URLSearchParams,
) {
  const response = await request("GET", `/zaak-selection/${key}/`, params);
  const data: ZaakSelectionAPIResponse = await response.json();
  const zaakSelection: ZaakSelection = data.items.reduce(
    (acc, val) => ({
      ...acc,
      [val.zaak as string]: {
        selected: val.selected,
        detail: val.detail,
      },
    }),
    {},
  );
  return zaakSelection;
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
