import { redirect } from "react-router-dom";

import { logout } from "../../lib/api/auth";
import { logoutLoader } from "./Logout.loader";

jest.mock("../../lib/api/auth", () => ({
  logout: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  redirect: jest.fn(),
}));

describe("logoutLoader", () => {
  it("calls logout and redirects to login", async () => {
    await logoutLoader();
    expect(logout).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
