import { Zaak } from "../../types";
import { ZaakSelection, _getZaakUrl } from "../zaakSelection";
import { request } from "./request";

/**
 * Get the selection for the given key.
 */
export async function getSelection<DetailType = unknown>(
  key: string,
  exp?: object,
  selectedOnly = true,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams(exp as Record<string, string>);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  selectedOnly && params.set("selected", "true");

  const response = await request(
    "GET",
    `/selections/${key}/`,
    params,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<ZaakSelection<DetailType>> = response.json();
  return promise;
}

/**
 * Returns all zaken in the zaak selection.
 */
export async function getSelectionItems<DetailType = unknown>(
  key: string,
  zaken: (string | Zaak)[],
  selectedOnly = true,
  signal?: AbortSignal,
) {
  const items = zaken.map((zaak) => _getZaakUrl(zaak));
  const params = new URLSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  selectedOnly && params.set("selected", "true");
  const response = await request(
    "POST",
    `/selections/${key}/`,
    params,
    { items },
    undefined,
    signal,
  );
  const data: ZaakSelection<DetailType> = await response.json();
  return data;
}

/**
 * Partially update the selection for the given key.
 */
export async function updateSelection<DetailType = unknown>(
  key: string,
  data: ZaakSelection,
  signal?: AbortSignal,
) {
  const response = await request(
    "PATCH",
    `/selections/${key}/`,
    undefined,
    data,
    undefined,
    signal,
  );
  const promise: Promise<ZaakSelection<DetailType>> = response.json();
  return promise;
}

/**
 * Clear the selection for the given key.
 */
export async function deleteSelection(key: string, signal?: AbortSignal) {
  await request(
    "DELETE",
    `/selections/${key}/`,
    undefined,
    undefined,
    undefined,
    signal,
  );
}

export type SelectionSizeResponse = {
  count: number;
};

/**
 * Retrieve the count of selected items for the given key.
 */
export async function getSelectionSize(key: string, signal?: AbortSignal) {
  const response = await request(
    "GET",
    `/selections/${key}/count/`,
    undefined,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<SelectionSizeResponse> = response.json();
  return promise;
}

export type AllSelectedResponse = {
  allSelected: boolean;
};

/**
 * Get the 'selected_all' property for the given selection key.
 */
export async function getAllSelected(key: string, signal?: AbortSignal) {
  const response = await request(
    "GET",
    `/selections/${key}/select-all/`,
    undefined,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<AllSelectedResponse> = response.json();
  const { allSelected } = await promise;
  return allSelected;
}

/**
 * Set the 'selected_all' property for the given selection key.
 */
export async function setAllSelected(
  key: string,
  selected: boolean,
  signal?: AbortSignal,
) {
  await request(
    selected ? "POST" : "DELETE",
    `/selections/${key}/select-all/`,
    undefined,
    undefined,
    undefined,
    signal,
  );
}
