import { getCookie } from "../cookie/cookie";

/** Scheme for all API requests.. */
export const API_SCHEME = "http";

/** The host for the API server. */
export const API_HOST = "localhost";

/** The port for the API server. */
export const API_PORT = 8080;

/** The base path for all API requests. */
export const API_PATH = "/api/v1";

/** The base url for all API requests. */
export const API_BASE_URL = `${API_SCHEME}://${API_HOST}:${API_PORT}${API_PATH}`;

/**
 * Makes an actual fetch request to the API, should be used by all other API implementations.
 * @param method
 * @param endpoint
 * @param params
 * @param data
 * @param headers
 */
export async function request(
  method: "GET" | "POST",
  endpoint: string,
  params?: URLSearchParams | Record<string, string>,
  data?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const queryString = params ? new URLSearchParams(params).toString() : "";
  const url = `${API_BASE_URL + endpoint}?${queryString}`;
  const csrfToken = getCookie("csrftoken");
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
