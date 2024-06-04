import { TypedField } from "@maykin-ui/admin-ui";

export type FieldSelection = {
  /**
   * A `Field.name` mapped to a `boolean`.
   * - `true`: The field is active
   * - `false`: The field is inactive
   */
  [index: string]: boolean;
};

/**
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fields An array containing either `TypedField` objects.
 */
export async function addToFieldSelection(key: string, fields: TypedField[]) {
  await _mutateFieldSelection(key, fields, true);
}

/**
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fields An array containing either `TypedField` objects.
 */
export async function removeFromFieldSelection(
  key: string,
  fields: TypedField[],
) {
  await _mutateFieldSelection(key, fields, false);
}

/**
 * Gets the field selection.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 */
export async function getFieldSelection(key: string) {
  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey) || "{}";
  return JSON.parse(json) as FieldSelection;
}

/**
 * Sets field selection cache.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fieldSelection
 */
export async function setFieldSelection(
  key: string,
  fieldSelection: FieldSelection,
) {
  const computedKey = _getComputedKey(key);
  const json = JSON.stringify(fieldSelection);
  sessionStorage.setItem(computedKey, json);
}

/**
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 */
export async function clearFieldSelection(key: string) {
  const computedKey = _getComputedKey(key);
  const json = "{}";
  sessionStorage.setItem(computedKey, json);
}

/**
 * Returns whether field is active.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param field Either a `Field.name` or `Field` object.
 */
export async function isFieldActive(key: string, field: TypedField) {
  const fieldSelection = await getFieldSelection(key);
  return fieldSelection[field.name];
}

/**
 * Mutates the field selection
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fields An array containing either `TypedField` objects.
 * @param active Indicating whether the selection should be added (`true) or removed (`false).
 */
export async function _mutateFieldSelection(
  key: string,
  fields: TypedField[],
  active: boolean,
) {
  const currentFieldSelection = await getFieldSelection(key);
  const names = fields.map((f) => f.name);

  const fieldSelectionOverrides = names.reduce<FieldSelection>(
    (partialFieldSelection, url) => ({
      ...partialFieldSelection,
      [url]: active,
    }),
    {},
  );

  const combinedFieldSelection = {
    ...currentFieldSelection,
    ...fieldSelectionOverrides,
  };

  await setFieldSelection(key, combinedFieldSelection);
}

/**
 * Computes the prefixed cache key.
 * @param key A key identifying the selection
 */
function _getComputedKey(key: string): string {
  return `oab.lib.fieldSelection.${key}`;
}
