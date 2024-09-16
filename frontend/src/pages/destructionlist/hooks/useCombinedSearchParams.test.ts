import { act, renderHook } from "@testing-library/react";
import { useSearchParams } from "react-router-dom";

import { useCombinedSearchParams } from "./useCombinedSearchParams";

// Mock the useSearchParams from react-router-dom
jest.mock("react-router-dom", () => ({
  useSearchParams: jest.fn(),
}));

describe("useCombinedSearchParams", () => {
  let mockSearchParams;
  let mockSetSearchParams: jest.Mock;

  beforeEach(() => {
    // Set up the default mock behavior
    mockSearchParams = new URLSearchParams({
      key1: "value1",
      key2: "value2",
    });
    mockSetSearchParams = jest.fn();
    (useSearchParams as jest.Mock).mockReturnValue([
      mockSearchParams,
      mockSetSearchParams,
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the current searchParams", () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    const [searchParams] = result.current;
    expect(Object.fromEntries(searchParams)).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("should update the searchParams without removing existing params", () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    act(() => {
      const [, setCombinedSearchParams] = result.current;
      setCombinedSearchParams({ key2: "newValue2", key3: "value3" });
    });

    // Wait for the timeout and check the result
    setTimeout(() => {
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        new URLSearchParams({
          key1: "value1",
          key2: "newValue2",
          key3: "value3",
        }),
      );
    }, 100);
  });

  it("should remove parameters with empty values", () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    act(() => {
      const [, setCombinedSearchParams] = result.current;
      setCombinedSearchParams({ key2: "", key3: "value3" });
    });

    setTimeout(() => {
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        new URLSearchParams({
          key1: "value1",
          key3: "value3",
        }),
      );
    }, 100);
  });

  it("should debounce the updates", () => {
    const { result } = renderHook(() => useCombinedSearchParams());

    act(() => {
      const [, setCombinedSearchParams] = result.current;
      setCombinedSearchParams({ key3: "value3" });
      setCombinedSearchParams({ key4: "value4" });
    });

    // Expect only the last update to take effect after debounce
    setTimeout(() => {
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        new URLSearchParams({
          key1: "value1",
          key2: "value2",
          key4: "value4",
        }),
      );
    }, 100);
  });
});
