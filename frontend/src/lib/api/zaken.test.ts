import fetchMock from "jest-fetch-mock";

import { zakenFactory } from "../../fixtures/zaak";
import { searchZaken } from "./zaken";

describe("searchZaken", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a list of users on success", async () => {
    const zaken = zakenFactory();
    fetchMock.mockResponseOnce(JSON.stringify(zaken));
    await expect(searchZaken()).resolves.toEqual(zaken);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(searchZaken()).rejects.toThrow("Internal Server Error");
  });
});
