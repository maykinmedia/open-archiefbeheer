import fetchMock from "jest-fetch-mock";

import { archivistFactory } from "../../fixtures/user";
import { listArchivists } from "./archivist";

describe("listArchivists", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a list of users on success", async () => {
    const archivists = [archivistFactory()];
    fetchMock.mockResponseOnce(JSON.stringify(archivists));
    await expect(listArchivists()).resolves.toEqual(archivists);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(listArchivists()).rejects.toThrow("Internal Server Error");
  });
});
