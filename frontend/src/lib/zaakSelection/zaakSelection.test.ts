// Replace with the correct path
import { Zaak } from "../../types";
import {
  addToZaakSelection,
  clearZaakSelection,
  getAllZakenSelected,
  getFilteredZaakSelection,
  getZaakSelection,
  getZaakSelectionItem,
  isZaakSelected,
  removeFromZaakSelection,
  setAllZakenSelected,
} from "./zaakSelection";

const mockZaak1: Zaak = { url: "https://example.com/zaak1" } as Zaak;
const mockZaak2 = "https://example.com/zaak2";
const mockKey = "testKey";

describe("Zaak Selection Functions", () => {
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

  it("should return a single selected Zaak", async () => {
    await addToZaakSelection(mockKey, [mockZaak1]);

    const zaak = await getZaakSelectionItem(mockKey, mockZaak1);
    expect(zaak?.selected).toBe(true);
  });

  it("should check if a Zaak is selected", async () => {
    await addToZaakSelection(mockKey, [mockZaak1]);

    const isSelected = await isZaakSelected(mockKey, mockZaak1);
    expect(isSelected).toBe(true);
  });

  it("should handle empty Zaak selections correctly", async () => {
    const selection = await getZaakSelection(mockKey);
    expect(selection).toEqual({});
  });
});
