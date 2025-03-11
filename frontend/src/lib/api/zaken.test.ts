import { zakenFactory } from "../../fixtures/zaak";
import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import { searchZaken } from "./zaken";

describe("searchZaken", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a list of users on success", async () => {
    const zaken = zakenFactory();
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/zaken/search/",
      zaken,
    );
    await expect(searchZaken()).resolves.toEqual(zaken);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("post", "http://localhost:8000/api/v1/zaken/search/");
    await expect(searchZaken()).rejects.toThrow();
  });
});
