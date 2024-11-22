import { Zaak } from "../../types";
import { ZaakSelection } from "./types";
import {
  addToZaakSelection,
  clearZaakSelection,
  compareZaakSelection,
  getAllZakenSelected,
  getFilteredZaakSelection,
  getZaakSelection,
  getZaakSelectionItems,
  removeFromZaakSelection,
  setAllZakenSelected,
} from "./zaakSelection";

const mockZaak1: Zaak = { url: "https://example.com/zaak1" } as Zaak;
const mockZaak2 = "https://example.com/zaak2";
const mockKey = "testKey";

describe("zaakSelection", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should add a Zaak to the selection", async () => {
    await addToZaakSelection(mockKey, [mockZaak1, mockZaak2]);

    const selection = await getZaakSelection(mockKey);
    expect(selection[mockZaak1.url as string].selected).toBe(true);
  });

  it("should remove a Zaak from the selection", async () => {
    await addToZaakSelection(mockKey, [mockZaak1, mockZaak2]);
    await removeFromZaakSelection(mockKey, [mockZaak1]);

    const selection = await getZaakSelection(mockKey);
    expect(selection[mockZaak1.url as string].selected).toBe(false);
    expect(selection[mockZaak2].selected).toBe(true);
  });

  it("should mark all Zaken as selected", async () => {
    await setAllZakenSelected(mockKey, true);
    const allSelected = await getAllZakenSelected(mockKey);
    expect(allSelected).toBe(true);
  });

  it("should mark all Zaken as unselected", async () => {
    await setAllZakenSelected(mockKey, true);
    const allSelectedTrue = await getAllZakenSelected(mockKey);
    expect(allSelectedTrue).toBe(true);

    await setAllZakenSelected(mockKey, false);
    const allSelectedFalse = await getAllZakenSelected(mockKey);
    expect(allSelectedFalse).toBe(false);
  });

  it("should clear the Zaak selection", async () => {
    await addToZaakSelection(mockKey, [mockZaak1]);
    await clearZaakSelection(mockKey);

    const selection = await getZaakSelection(mockKey);
    expect(selection).toEqual({});
  });

  it("should return the correct filtered Zaak selection", async () => {
    const detail = { status: "open" };
    await addToZaakSelection(mockKey, [mockZaak1], detail);
    await addToZaakSelection(mockKey, [mockZaak2], { status: "closed" });

    const filteredSelection = await getFilteredZaakSelection(mockKey, {
      status: "open",
    });

    expect(filteredSelection[mockZaak1.url as string].detail).toEqual(detail);
    expect(filteredSelection[mockZaak2]).toBeUndefined();
  });

  it("should return explicitly unselected items when calling `getFilteredZaakSelection` with `selectedOnly=false`", async () => {
    const detail = { status: "open" };
    await addToZaakSelection(mockKey, [mockZaak1], detail);
    await addToZaakSelection(mockKey, [mockZaak2], { status: "closed" });
    await removeFromZaakSelection(mockKey, [mockZaak2]);

    const filteredSelection = await getFilteredZaakSelection(
      mockKey,
      undefined,
      false,
    );

    expect(Object.keys(filteredSelection)).toHaveLength(2);
    expect(filteredSelection[mockZaak1.url as string].selected).toBeTruthy();
    expect(filteredSelection[mockZaak2].selected).toBeFalsy();
  });

  it("should return a single selected Zaak", async () => {
    await addToZaakSelection(mockKey, [mockZaak1]);

    const selection = await getZaakSelectionItems(mockKey, [mockZaak1]);
    expect(selection[mockZaak1.url as string]?.selected).toBe(true);
  });

  it("should handle empty Zaak selections correctly", async () => {
    const selection = await getZaakSelection(mockKey);
    expect(selection).toEqual({});
  });

  it("should compare ZaakSelection items correctly", async () => {
    const a: ZaakSelection = {
      "https://example.com/zaak1": {
        selected: false,
      },
      "https://example.com/zaak2": {
        selected: true,
      },
    };

    const b: ZaakSelection = {
      "https://example.com/zaak2": {
        selected: true,
      },
      "https://example.com/zaak1": {
        selected: false,
      },
    };

    const c: ZaakSelection = {
      "https://example.com/zaak1": {
        selected: true,
      },
      "https://example.com/zaak2": {
        selected: true,
      },
    };

    const d: ZaakSelection = {
      "https://example.com/zaak1": {
        selected: false,
        detail: {
          approved: false,
        },
      },
      "https://example.com/zaak2": {
        selected: true,
        detail: {
          approved: false,
        },
      },
    };

    const e: ZaakSelection = {
      "https://example.com/zaak2": {
        selected: true,
        detail: {
          approved: false,
        },
      },
      "https://example.com/zaak1": {
        selected: false,
        detail: {
          approved: false,
        },
      },
    };

    const f: ZaakSelection = {
      "https://example.com/zaak1": {
        selected: false,
        detail: {
          approved: true,
        },
      },
      "https://example.com/zaak2": {
        selected: true,
        detail: {
          approved: true,
        },
      },
    };

    expect(compareZaakSelection(a, b)).toBeTruthy();
    expect(compareZaakSelection(b, a)).toBeTruthy();
    expect(compareZaakSelection(a, c)).toBeFalsy();
    expect(compareZaakSelection(a, d)).toBeFalsy();
    expect(compareZaakSelection(d, e)).toBeTruthy();
    expect(compareZaakSelection(d, f)).toBeFalsy();
  });
});
