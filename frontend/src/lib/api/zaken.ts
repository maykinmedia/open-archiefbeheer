import { request } from "./request";

export type Zaak = {
  // TODO
};

/**
 * Retrieve zaken using the configured ZRC service. For information over the query parameters accepted and the schema of
 * the response, look at the '/zaken/api/v1/zaken' list endpoint of Open Zaak.
 */
export async function listZaken() {
  const response = await request("GET", "/zaken/");
  const promise: Promise<Zaak[]> = response.json();
  return promise;
}
