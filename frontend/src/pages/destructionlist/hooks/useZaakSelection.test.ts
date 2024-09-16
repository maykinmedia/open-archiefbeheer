import { act, renderHook, waitFor } from "@testing-library/react";

import { Zaak } from "../../../types";
import { useZaakSelection } from "./useZaakSelection";

jest.mock("react-router-dom", () => ({
  useRevalidator: () => ({ revalidate: () => undefined }),
}));

describe("useZaakSelection hook", () => {
  const zaken = [
    { url: "zaak-1" } as Zaak,
    { url: "zaak-2" } as Zaak,
    { url: "zaak-3" } as Zaak,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with no selection", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken));

    await waitFor(() => {
      expect(result.current[0]).toEqual([]); // selectedZakenOnPage is empty
      expect(result.current[2].hasSelection).toBe(false);
      expect(result.current[2].allPagesSelected).toBe(false);
    });
  });

  it("should select items on page", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken));

    // Select items
    await act(async () => {
      await result.current[1]([{ url: "zaak-1" }], true);
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual([{ url: "zaak-1" }]); // zaak-1 should now be selected
    });
  });

  it("should deselect items on page", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken));

    // Deselect items
    await act(async () => {
      await result.current[1]([{ url: "zaak-1" }], false);
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual([]); // No items selected now
    });
  });

  it("should select all pages", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken));

    // Select all pages
    await act(async () => {
      await result.current[2].handleSelectAllPages(true);
    });

    await waitFor(() => {
      expect(result.current[2].allPagesSelected).toBe(true);
    });
  });

  it.only("should clear selection", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken));

    // Clear selection
    await act(async () => {
      await result.current[2].clearZaakSelection();
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual([]); // selectedZakenOnPage is empty
    });
  });
});
