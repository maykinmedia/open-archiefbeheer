import { appLoader } from "./App.loader";
import { cacheDelete } from "./lib/cache/cache";

vi.mock("./lib/cache/cache", () => ({
  cacheDelete: vi.fn(),
}));
describe("appLoader", () => {
  it("calls app and redirects to login", async () => {
    await appLoader({
      request: { url: "https://zaken.nl?hijack=1" } as unknown as Request,
      params: {},
    });
    expect(cacheDelete).toHaveBeenCalled();
  });
});
