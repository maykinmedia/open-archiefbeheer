import { archivistFactory } from "../../fixtures/user";
import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import { listArchivists } from "./archivist";

describe("listArchivists", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a list of users on success", async () => {
    const archivists = [archivistFactory()];
    mockResponseOnce("get", "http://localhost:8000/api/v1/users", archivists);
    await expect(listArchivists()).resolves.toEqual(archivists);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/users");
    await expect(listArchivists()).rejects.toThrow();
  });
});
