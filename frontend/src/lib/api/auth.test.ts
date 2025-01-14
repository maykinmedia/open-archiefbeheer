import fetchMock from "jest-fetch-mock";

import { OidcConfigContextType } from "../../contexts";
import { userFactory } from "../../fixtures/user";
import { getOIDCInfo, login, logout, whoAmI } from "./auth";

describe("login", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should resolve when login succeeds", async () => {
    fetchMock.mockResponseOnce("");
    await expect(
      login("Record Manager", "ANic3Password"),
    ).resolves.toBeTruthy();
  });

  it("should throw an error if login fails", async () => {
    fetchMock.mockRejectOnce(new Error("Permission Denied"));
    await expect(login("Record Manager", "Incorrect Password")).rejects.toThrow(
      "Permission Denied",
    );
  });
});

describe("logout", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should resolve when logout succeeds", async () => {
    fetchMock.mockResponseOnce("");
    await expect(logout()).resolves.toBeTruthy();
  });

  it("should throw an error if logout fails", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(logout()).rejects.toThrow("Internal Server Erro");
  });
});

describe("whoAmI", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    sessionStorage.clear(); // Clear the cache.
    fetchMock.resetMocks();
  });

  it("should return a user on success", async () => {
    const user = userFactory();
    fetchMock.mockResponseOnce(JSON.stringify(user));
    await expect(whoAmI()).resolves.toEqual(user);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(whoAmI()).rejects.toThrow("Internal Server Error");
  });
});

describe("getOIDCInfo", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    sessionStorage.clear(); // Clear the cache.
    fetchMock.resetMocks();
  });

  it("should return a OIDC info on success", async () => {
    const oidcConfig: OidcConfigContextType = {
      enabled: true,
      loginUrl: "/login",
    };
    fetchMock.mockResponseOnce(JSON.stringify(oidcConfig));
    await expect(getOIDCInfo()).resolves.toEqual(oidcConfig);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(getOIDCInfo()).rejects.toThrow("Internal Server Error");
  });
});
