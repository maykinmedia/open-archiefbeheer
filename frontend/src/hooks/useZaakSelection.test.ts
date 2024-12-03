import { act, renderHook, waitFor } from "@testing-library/react";

import { ZaakSelectionContextProvider } from "../contexts";
import { ZaakIdentifier } from "../lib/zaakSelection";
import { Zaak } from "../types";
import { useZaakSelection } from "./useZaakSelection";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useRevalidator: () => ({ revalidate: () => undefined }),
}));

describe("useZaakSelection hook", () => {
  const zaken: ZaakIdentifier[] = [
    { url: "zaak-1" },
    { url: "zaak-2" },
    { url: "zaak-3" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with no selection", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    await waitFor(() => {
      const [selectedZakenOnPage, , { hasSelection, allPagesSelected }] =
        result.current;

      expect(selectedZakenOnPage).toEqual([]); // selectedZakenOnPage is empty
      expect(hasSelection).toBe(false);
      expect(allPagesSelected).toBe(false);
    });
  });

  it("should select items on page", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    // Select items
    await act(async () => {
      const [, handleSelect] = result.current;
      await handleSelect([{ url: "zaak-1" }], true);
    });

    await waitFor(() => {
      const [selectedZakenOnPage, , { selectionSize }] = result.current;
      expect(selectedZakenOnPage).toEqual([{ url: "zaak-1" }]); // zaak-1 should now be selected
      expect(selectionSize).toEqual(1); // 1 zaak should now be selected
    });
  });

  it("should deselect items on page", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    // Deselect items
    await act(async () => {
      const [, handleSelect] = result.current;
      await handleSelect([{ url: "zaak-1" }], false);
    });

    await waitFor(() => {
      const [zaakSelection] = result.current;
      expect(zaakSelection).toEqual([]); // No items selected now
    });
  });

  it("should select all pages", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    // Select all pages
    await act(async () => {
      const [, , { handleSelectAllPages }] = result.current;
      await handleSelectAllPages(true);
    });

    await waitFor(() => {
      const [, , { allPagesSelected }] = result.current;
      expect(allPagesSelected).toBe(true);
    });
  });

  it("should clear selection", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    // Clear selection
    await act(async () => {
      const [, , { clearZaakSelection }] = result.current;
      await clearZaakSelection();
    });

    await waitFor(() => {
      const selectedZakenOnPage = result.current[0];
      expect(selectedZakenOnPage).toEqual([]); // selectedZakenOnPage is empty
    });
  });
});
