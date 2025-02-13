import { Zaak } from "../../types";
import { PaginatedResults } from "./paginatedResults";
import { request } from "./request";

export type PaginatedZaken = PaginatedResults<Zaak>;

/**
 * Search zaken using the configured ZRC service. For information over the filters that can be passed in the
 * request body, look at query params of the '/zaken/api/v1/zaken' list endpoint of Open Zaak.
 */
export async function searchZaken(params?: Record<string, string>) {
  const response = await request(
    "POST",
    "/zaken/search/",
    new URLSearchParams(),
    params,
  );
  const promise: Promise<PaginatedZaken> = response.json();
  return promise;
}
