import { Zaak } from "../../types";
import { PaginatedResults } from "./paginatedResults";
import { request } from "./request";

export type PaginatedZaken = PaginatedResults<Zaak>;

/**
 * Retrieve zaken using the configured ZRC service. For information over the query parameters accepted and the schema of
 * the response, look at the '/zaken/api/v1/zaken' list endpoint of Open Zaak.
 */
export async function listZaken(params?: Record<string, string>) {
  const response = await request(
    "POST",
    "/zaken/search/",
    new URLSearchParams(),
    params,
  );
  const promise: Promise<PaginatedZaken> = response.json();
  return promise;
}
