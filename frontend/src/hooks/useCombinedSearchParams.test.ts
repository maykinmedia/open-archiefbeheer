import { act, renderHook } from "@testing-library/react";
import { useSearchParams } from "react-router-dom";
import { Mock, vi } from "vitest";

import { useCombinedSearchParams } from "./useCombinedSearchParams";

// Mock the useSearchParams from react-router-dom
vi.mock("react-router-dom", () => ({
  useSearchParams: vi.fn(),
}));

describe("useCombinedSearchParams", () => {
  let mockSearchParams: URLSearchParams;
  let mockSetSearchParams: Mock;

  beforeEach(() => {
    // Set up the default mock behavior
    mockSearchParams = new URLSearchParams({
      key1: "value1",
      key2: "value2",
    });
    mockSetSearchParams = vi.fn();
    (useSearchParams as Mock).mockReturnValue([
      mockSearchParams,
      mockSetSearchParams,
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return the current searchParams", () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    const [searchParams] = result.current;
    expect(Object.fromEntries(searchParams)).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("should update the searchParams without removing existing params", async () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    act(() => {
      const [, setCombinedSearchParams] = result.current;
      setCombinedSearchParams({ key2: "newValue2", key3: "value3" });
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetSearchParams).toHaveBeenCalledWith(
      new URLSearchParams({
        key1: "value1",
        key2: "newValue2",
        key3: "value3",
      }),
    );
  });

  it("should remove parameters with empty values", async () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    act(() => {
      const [, setCombinedSearchParams] = result.current;
      setCombinedSearchParams({ key2: "", key3: "value3" });
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetSearchParams).toHaveBeenCalledWith(
      new URLSearchParams({
        key1: "value1",
        key3: "value3",
      }),
    );
  });

  it("should debounce the updates", async () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    act(() => {
      const [, setCombinedSearchParams] = result.current;
      setCombinedSearchParams({ key3: "value3" });
      setCombinedSearchParams({ key4: "value4" });
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Expect only the last update to take effect after debounce
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      new URLSearchParams({
        key1: "value1",
        key2: "value2",
        key4: "value4",
      }),
    );
  });
});
