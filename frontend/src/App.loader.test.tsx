import { RouterContextProvider } from "react-router";

import { appLoader } from "./App.loader";
import { cacheDelete } from "./lib/cache/cache";

vi.mock("./lib/cache/cache", () => ({
  cacheDelete: vi.fn(),
}));
describe("appLoader", () => {
  it("calls app and redirects to login", async () => {
    await appLoader({
      request: new Request("https://zaken.nl?hijack=1"),
      params: {},
      context: new RouterContextProvider(),
      url: new URL("http://zaken.nl"),
      pattern: "/",
    });
    expect(cacheDelete).toHaveBeenCalled();
  });
});
