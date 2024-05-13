import { getCookie } from "../cookie/cookie";

/** The base url for all API requests. */
export const BASE_URL = "http://localhost:8000/api/v1";

/**
 * Makes an actual fetch request to the API, should be used by all other API implementations.
 * @param method
 * @param endpoint
 * @param data
 * @param headers
 */
export async function request(
  method: "GET" | "POST",
  endpoint: string,
  data?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const csrfToken = getCookie("csrftoken");
  const url = BASE_URL + endpoint;
  const abortController = new AbortController();

  const response = await fetch(url, {
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken || "",
      ...headers,
    },
    method: method,
    signal: abortController.signal,
  });

  if (response.ok) {
    return response;
  } else {
    throw response;
  }
}
