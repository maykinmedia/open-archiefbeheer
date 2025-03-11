import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import {
  ArchiveConfiguration,
  getArchiveConfiguration,
  patchArchiveConfiguration,
} from "./config";

describe("getArchiveConfiguration", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return an ArchiveConfiguration on success", async () => {
    const archiveConfiguration = {
      zaaktypesShortProcess: ["http://zaken.nl"],
    };
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/archive-config",
      archiveConfiguration,
    );
    await expect(getArchiveConfiguration()).resolves.toEqual(
      archiveConfiguration,
    );
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/archive-config");
    await expect(getArchiveConfiguration()).rejects.toThrow();
  });
});

describe("patchArchiveConfiguration", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return undefined on success", async () => {
    mockResponseOnce("patch", "http://localhost:8000/api/v1/archive-config");
    await expect(
      patchArchiveConfiguration({
        zaaktypesShortProcess: ["http://zaken.nl"],
      } as unknown as ArchiveConfiguration),
    ).resolves.toBeUndefined();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("patch", "http://localhost:8000/api/v1/archive-config");
    await expect(
      patchArchiveConfiguration({
        zaaktypesShortProcess: ["http://zaken.nl"],
      } as unknown as ArchiveConfiguration),
    ).rejects.toThrow();
  });
});
