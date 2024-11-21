import { responseFactory } from "../../fixtures/response";

const SYMBOL_NATIVE_FETCH = Symbol();
const SYMBOL_MOCKED_REQUESTS = Symbol();
// @ts-expect-error - set native reference.
window[SYMBOL_NATIVE_FETCH] = window.fetch;
// @ts-expect-error - set mocked requests record.
window[SYMBOL_MOCKED_REQUESTS] = {};

/**
 * Mock fetch() function.
 * This is useful when using Jest tests, use storybook-addon-mock for stories
 * (if available).
 */
export function addFetchMock(
  mockUrl: string,
  mockMethod: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
  responseData: unknown = {},
) {
  window.fetch = async (...args) => {
    const [url, requestInit] = args;
    const method = requestInit?.method || "GET";

    // Use mock if method and url match mock.
    if (url === mockUrl && method === mockMethod) {
      // Update window[SYMBOL_MOCKED_REQUESTS]
      // @ts-expect-error - set mocked requests record.
      window[SYMBOL_MOCKED_REQUESTS][url] = [
        // @ts-expect-error - get mocked requests record.
        ...(window[SYMBOL_MOCKED_REQUESTS][url] || []),
        requestInit,
      ];

      // Return responseData
      return responseFactory({ json: async () => responseData });
    }

    // We have mocks active (so testing environment) but are making live
    // requests. This is probably unwanted.
    // NOTE: Use e2e test to test actual integration.
    console.warn(method, url, "unmocked!");

    // @ts-expect-error - get native reference.
    return window[SYMBOL_NATIVE_FETCH](...args);
  };
}

/**
 * Restores original fetch function.
 */
export function restoreNativeFetch() {
  // @ts-expect-error - check native implementation
  if (window[SYMBOL_NATIVE_FETCH]) {
    // @ts-expect-error - set native implementation
    window.fetch = window[SYMBOL_NATIVE_FETCH];
  }
}

/**
 * Returns calls to mocked URL.
 * @param mockUrl
 * @param mockMethod
 */
export function getMockedRequests(
  mockUrl: string,
  mockMethod: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
): RequestInit[] {
  const records: RequestInit[] =
    // @ts-expect-error - get mocked requests records.
    window[SYMBOL_MOCKED_REQUESTS][mockUrl] || [];

  return records.filter(
    (requestInit: RequestInit) => (requestInit.method || "GET") === mockMethod,
  );
}

/**
 * Returns last call to mocked URL.
 * @param mockUrl
 * @param mockMethod
 */
export function getLastMockedRequest(
  mockUrl: string,
  mockMethod: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
): RequestInit | undefined {
  const mockedRequests = getMockedRequests(mockUrl, mockMethod);
  return mockedRequests[mockedRequests.length - 1];
}
