import { getCookie } from "../cookie/cookie";

/** Host for all API requests. */
export const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost";

/** Port for all API requests. */
export const API_PORT =
  document.body.dataset.testApiPort || process.env.REACT_APP_API_PORT || 8000;

/** Base URL for all API requests. */
export const API_URL =
  process.env.REACT_APP_API_URL || `${API_HOST}:${API_PORT}`;

/** The base path for all API requests. */
export const API_PATH = process.env.REACT_APP_API_PATH || "/api/v1";

/** The base url for all API requests. */
export const API_BASE_URL = `${API_URL}${API_PATH}`;

/**
 * Makes an actual fetch request to the API, should be used by all other API implementations.
 * @param method
 * @param endpoint
 * @param params
 * @param data
 * @param headers
 * @param [signal]
 */
export async function request(
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
  endpoint: string,
  params?: URLSearchParams | Record<string, string | number>,
  data?: Record<string, unknown>,
  headers?: Record<string, string>,
  signal?: AbortSignal,
) {
  // @ts-expect-error - params can be number, ignoring...
  const queryString = params ? new URLSearchParams(params).toString() : "";
  const url = `${API_BASE_URL + endpoint}?${queryString}`;
  const csrfToken = getCookie("csrftoken");

  const response = await fetch(url, {
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken || "",
      ...headers,
    },
    method: method,
    signal: signal,
  });

  if (response.ok) {
    return response;
  } else {
    throw response;
  }
}
