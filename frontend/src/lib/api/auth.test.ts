import { OidcConfigContextType } from "../../contexts";
import { userFactory } from "../../fixtures/user";
import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import { getOIDCInfo, login, logout, whoAmI } from "./auth";

describe("login", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should resolve when login succeeds", async () => {
    mockResponseOnce("post", "http://localhost:8000/api/v1/auth/login/");
    await expect(
      login("Record Manager", "ANic3Password"),
    ).resolves.toBeTruthy();
  });

  it("should throw an error if login fails", async () => {
    mockRejectOnce("post", "http://localhost:8000/api/v1/auth/login/");
    await expect(
      login("Record Manager", "Incorrect Password"),
    ).rejects.toThrow();
  });
});

describe("logout", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should resolve when logout succeeds", async () => {
    mockResponseOnce("post", "http://localhost:8000/api/v1/auth/logout/");
    await expect(logout()).resolves.toBeTruthy();
  });

  it("should throw an error if logout fails", async () => {
    mockRejectOnce("post", "http://localhost:8000/api/v1/auth/logout/");
    await expect(logout()).rejects.toThrow();
  });
});

describe("whoAmI", () => {
  afterEach(() => {
    resetMocks();
    sessionStorage.clear();
  });

  it("should return a user on success", async () => {
    const user = userFactory();
    mockResponseOnce("get", "http://localhost:8000/api/v1/whoami/", user);
    await expect(whoAmI()).resolves.toEqual(user);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/whoami/");
    await expect(whoAmI()).rejects.toThrow();
  });
});

describe("getOIDCInfo", () => {
  afterEach(() => {
    resetMocks();
    sessionStorage.clear();
  });

  it("should return a OIDC info on success", async () => {
    const oidcConfig: OidcConfigContextType = {
      enabled: true,
      loginUrl: "/login",
    };
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/oidc-info",
      oidcConfig,
    );
    await expect(getOIDCInfo()).resolves.toEqual(oidcConfig);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/oidc-info");
    await expect(getOIDCInfo()).rejects.toThrow();
  });
});
