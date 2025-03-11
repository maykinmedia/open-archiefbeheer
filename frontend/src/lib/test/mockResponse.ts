import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

// The msw mock server.
const server = setupServer();

/**
 * Mocks single `method` call to `url` faking `response` using msw.
 *
 * @param method - The method to use, use "all" to mock all methods.
 * @param url - The url to mock.
 * @param response - The (JSON) object to respond with.
 */
export function mockResponseOnce(
  method: keyof typeof http,
  url: string,
  response?: object | null | Response,
) {
  const _response =
    response instanceof Response ? response : HttpResponse.json(response);
  _mock(method, url, _response);
}

/**
 * Mocks single `method` call to `url` faking error using msw.
 *
 * @param method - The method to use, use "all" to mock all methods.
 * @param url - The url to mock.
 */
export function mockRejectOnce(method: keyof typeof http, url: string) {
  _mock(method, url, HttpResponse.error());
}

/**
 * Sets up `method` mock for`url` using msw.
 *
 * @param method - The method to use, use "all" to mock all methods.
 * @param url - The url to mock.
 * @param response - The response to respond with, support msw responses like `HttpResponse`.
 * @private
 */
function _mock(method: keyof typeof http, url: string, response: Response) {
  const handlers = [
    http[method](
      url,
      ({ request }) => {
        _addInterceptedRequest(request);
        return response;
      },
      { once: true },
    ),
  ];
  server.use(...server.listHandlers(), ...handlers); // Move to separate?
  server.listen(); // Move to separate?
}

/**
 * Clears the created mocks and intercepted requests, call this in `afterEach()`.
 */
export function resetMocks() {
  server.resetHandlers();
  server.close();
  _clearInterceptedRequest();
}

let INTERCEPTED_REQUESTS: Request[] = [];

/**
 * Returns the intercepted requests
 */
export function getInterceptedRequest() {
  return INTERCEPTED_REQUESTS;
}

/**
 * Adds an intercepted request for retrieval with `getInterceptedRequest`.
 *
 * @private
 */
function _addInterceptedRequest(request: Request) {
  INTERCEPTED_REQUESTS.push(request);
}

/**
 * Clears intercepted request for retrieval with `getInterceptedRequest`.
 *
 * @private
 */
function _clearInterceptedRequest() {
  INTERCEPTED_REQUESTS = [];
}
