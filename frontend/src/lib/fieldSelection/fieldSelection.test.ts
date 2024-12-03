import { TypedField } from "@maykin-ui/admin-ui";

import {
  FieldSelection,
  addToFieldSelection,
  clearFieldSelection,
  getFieldSelection,
  isFieldActive,
  removeFromFieldSelection,
  setFieldSelection,
} from "./fieldSelection";

describe("fieldSelection", () => {
  const testKey = "testKey";
  const mockFields: TypedField<Record<string, unknown>>[] = [
    { name: "field1", type: "boolean" },
    { name: "field2", type: "number" },
    { name: "field3", type: "string" },
  ];

  beforeEach(() => {
    sessionStorage.clear();
  });

  test("should add fields to selection", async () => {
    await addToFieldSelection(testKey, mockFields);

    const result = await getFieldSelection(testKey);
    expect(result).toEqual({
      field1: true,
      field2: true,
      field3: true,
    });
  });

  test("should remove fields from selection", async () => {
    await addToFieldSelection(testKey, mockFields);
    await removeFromFieldSelection(testKey, [mockFields[0]]);

    const result = await getFieldSelection(testKey);
    expect(result).toEqual({
      field1: false,
      field2: true,
      field3: true,
    });
  });

  test("should retrieve field selection", async () => {
    const fieldSelection: FieldSelection<Record<string, unknown>> = {
      field1: true,
      field2: false,
    };
    await setFieldSelection(testKey, fieldSelection);

    const result = await getFieldSelection(testKey);
    expect(result).toEqual(fieldSelection);
  });

  test("should clear field selection", async () => {
    const fieldSelection = { field1: true, field2: true };
    await setFieldSelection(testKey, fieldSelection);

    await clearFieldSelection(testKey);

    const result = await getFieldSelection(testKey);
    expect(result).toEqual({});
  });

  test("should check if a field is active", async () => {
    const fieldSelection = { field1: true, field2: false };
    await setFieldSelection(testKey, fieldSelection);

    const isActive1 = await isFieldActive(testKey, mockFields[0]);
    const isActive2 = await isFieldActive(testKey, mockFields[1]);

    expect(isActive1).toBe(true);
    expect(isActive2).toBe(false);
  });

  test("should handle non-existent keys gracefully", async () => {
    const result = await getFieldSelection("nonExistentKey");
    expect(result).toEqual({});
  });

  test("should update existing field selection when adding new fields", async () => {
    await addToFieldSelection(testKey, [mockFields[0]]);
    await addToFieldSelection(testKey, [mockFields[1]]);

    const result = await getFieldSelection(testKey);
    expect(result).toEqual({
      field1: true,
      field2: true,
    });
  });

  test("should update existing field selection when removing fields", async () => {
    await addToFieldSelection(testKey, mockFields);
    await removeFromFieldSelection(testKey, [mockFields[1]]);

    const result = await getFieldSelection(testKey);
    expect(result).toEqual({
      field1: true,
      field2: false,
      field3: true,
    });
  });
});
