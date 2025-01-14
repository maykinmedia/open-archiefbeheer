import fetchMock from "jest-fetch-mock";

import { zakenFactory } from "../../fixtures/zaak";
import { listZaken } from "./zaken";

describe("listZaken", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a list of users on success", async () => {
    const zaken = zakenFactory();
    fetchMock.mockResponseOnce(JSON.stringify(zaken));
    await expect(listZaken()).resolves.toEqual(zaken);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(listZaken()).rejects.toThrow("Internal Server Error");
  });
});
