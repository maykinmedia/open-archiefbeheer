import { recordManagerFactory, userFactory } from "../../../fixtures";
import {
  getInterceptedRequest,
  mockResponseOnce,
  resetMocks,
} from "../../../lib/test/mockResponse";
import { destructionListCreateLoader } from "./DestructionListCreate.loader";

describe("destructionListCreateLoader", () => {
  afterEach(() => resetMocks());

  it("should not be possible to override fixed settings with query parameters", async () => {
    const request = new Request(
      "http://localhost/destruction-lists/create?not_in_destruction_list=false&archiefactiedatum__isnull=true",
    );

    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/whoami/",
      recordManagerFactory(),
    );
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/users",
      userFactory(),
    );
    mockResponseOnce("post", "http://localhost:8000/api/v1/zaken/search/", []);

    await destructionListCreateLoader({ request, params: {} });
    const requests = getInterceptedRequest();
    await expect(requests[1].json()).resolves.toEqual({
      not_in_destruction_list: "true",
      archiefactiedatum__isnull: "false",
    });
  });
});
