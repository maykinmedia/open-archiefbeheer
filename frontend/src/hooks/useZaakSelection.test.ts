import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ZaakSelectionContextProvider } from "../contexts";
import { ZaakIdentifier } from "../lib/zaakSelection";
import { useZaakSelection } from "./useZaakSelection";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useRevalidator: () => ({
      revalidate: vi.fn(), // Zorg dat deze functie correct gemockt wordt
    }),
  };
});

describe("useZaakSelection hook", () => {
  const zaken: ZaakIdentifier[] = [
    { url: "zaak-1" },
    { url: "zaak-2" },
    { url: "zaak-3" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear(); // Voorkom dat eerdere selecties de test beïnvloeden
  });

  it("should initialize with no selection", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    await waitFor(() => {
      const [selectedZakenOnPage, , { hasSelection, allPagesSelected }] =
        result.current;

      expect(selectedZakenOnPage).toEqual([]);
      expect(hasSelection).toBe(false);
      expect(allPagesSelected).toBe(false);
    });
  });

  it("should select items on page", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    await act(async () => {
      const [, handleSelect] = result.current;
      handleSelect([{ url: "zaak-1" }], true);
    });

    await waitFor(() => {
      const [selectedZakenOnPage, , { selectionSize }] = result.current;
      expect(selectedZakenOnPage).toEqual([{ url: "zaak-1" }]);
      expect(selectionSize).toEqual(1);
    });
  });

  it("should deselect items on page", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    await act(async () => {
      const [, handleSelect] = result.current;
      handleSelect([{ url: "zaak-1" }], false);
    });

    await waitFor(() => {
      const [zaakSelection] = result.current;
      expect(zaakSelection).toEqual([]);
    });
  });

  it("should select all pages", async () => {
    const { result } = renderHook(() => useZaakSelection("storageKey", zaken), {
      wrapper: ZaakSelectionContextProvider,
    });

    await act(async () => {
      const [, , { handleSelectAllPages }] = result.current;
      handleSelectAllPages(true);
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

    await act(async () => {
      const [, , { clearZaakSelection }] = result.current;
      clearZaakSelection();
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual([]);
    });
  });
});
