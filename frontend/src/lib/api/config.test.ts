import fetchMock from "jest-fetch-mock";

import {
  ArchiveConfiguration,
  getArchiveConfiguration,
  patchArchiveConfiguration,
} from "./config";

describe("getArchiveConfiguration", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return an ArchiveConfiguration on success", async () => {
    const archiveConfiguration = {
      zaaktypesShortProcess: ["http://zaken.nl"],
    } as unknown as ArchiveConfiguration;
    fetchMock.mockResponseOnce(JSON.stringify(archiveConfiguration));
    await expect(getArchiveConfiguration()).resolves.toEqual(
      archiveConfiguration,
    );
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(getArchiveConfiguration()).rejects.toThrow(
      "Internal Server Error",
    );
  });
});

describe("patchArchiveConfiguration", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });
  it("should return undefined on success", async () => {
    await expect(
      patchArchiveConfiguration({
        zaaktypesShortProcess: ["http://zaken.nl"],
      } as unknown as ArchiveConfiguration),
    ).resolves.toBeUndefined();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      patchArchiveConfiguration({
        zaaktypesShortProcess: ["http://zaken.nl"],
      } as unknown as ArchiveConfiguration),
    ).rejects.toThrow("Internal Server Error");
  });
});
