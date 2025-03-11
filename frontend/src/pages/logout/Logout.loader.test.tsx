import { redirect } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { logout } from "../../lib/api/auth";
import { logoutLoader } from "./Logout.loader";

vi.mock("../../lib/api/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  redirect: vi.fn(),
}));

describe("logoutLoader", () => {
  it("calls logout and redirects to login", async () => {
    await logoutLoader();
    expect(logout).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
