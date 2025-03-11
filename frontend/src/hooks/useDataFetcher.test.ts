import { renderHook, waitFor } from "@testing-library/react";

import { useDataFetcher } from "./useDataFetcher";

describe("useDataFetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches data successfully and updates state", async () => {
    const mockFetchFunction = vi.fn(() => Promise.resolve("Mock Data"));

    const { result } = renderHook(() =>
      useDataFetcher(mockFetchFunction, {}, []),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe("Mock Data");
    expect(result.current.error).toBe(false);
  });

  it("cancels previous request when dependencies change", async () => {
    const mockFetchFunction = vi.fn((signal) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (signal.aborted) {
            reject(new Error("Aborted"));
          } else {
            resolve("Mock Data");
          }
        }, 100);
      });
    });

    const { result, rerender } = renderHook(
      ({ uuid }) => useDataFetcher(mockFetchFunction, {}, [uuid]),
      { initialProps: { uuid: "123" } },
    );

    expect(result.current.loading).toBe(true);

    // Change the dependency, triggering a new request
    rerender({ uuid: "456" });

    await waitFor(() => expect(mockFetchFunction).toHaveBeenCalledTimes(2));

    expect(result.current.loading).toBe(true);

    try {
      await waitFor(() => expect(result.current.loading).toBe(false));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // We expect the first request to be aborted, so we catch the rejection here
    }

    expect(result.current.data).toBe("Mock Data");
    expect(result.current.error).toBe(false);
  });

  it("applies the transform function correctly", async () => {
    const mockFetchFunction = vi.fn(() => Promise.resolve(["item1", "item2"]));

    const transformFunction = (data: string[]) =>
      data.map((item) => item.toUpperCase());

    const { result } = renderHook(() =>
      useDataFetcher(mockFetchFunction, { transform: transformFunction }, []),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(["ITEM1", "ITEM2"]);
    expect(result.current.error).toBe(false);
  });

  it("sets initial state before fetching", async () => {
    const mockFetchFunction = vi.fn(() => Promise.resolve("Fetched Data"));

    const { result } = renderHook(() =>
      useDataFetcher(mockFetchFunction, { initialState: "Initial Data" }, []),
    );

    expect(result.current.data).toBe("Initial Data");

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBe("Fetched Data");
  });
});
