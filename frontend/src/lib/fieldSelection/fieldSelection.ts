import { TypedField } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";

export type FieldSelection<T extends object = Zaak> = Record<keyof T, boolean>;

/**
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fields An array containing either `TypedField` objects.
 */
export async function addToFieldSelection<T extends object = Zaak>(
  key: string,
  fields: TypedField<T>[],
) {
  await _mutateFieldSelection(key, fields, true);
}

/**
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fields An array containing either `TypedField` objects.
 */
export async function removeFromFieldSelection<T extends object = Zaak>(
  key: string,
  fields: TypedField<T>[],
) {
  await _mutateFieldSelection(key, fields, false);
}

/**
 * Gets the field selection.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 */
export async function getFieldSelection<T extends object = Zaak>(key: string) {
  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey) || "{}";
  return JSON.parse(json) as FieldSelection<T>;
}

/**
 * Sets field selection cache.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fieldSelection
 */
export async function setFieldSelection<T extends object = Zaak>(
  key: string,
  fieldSelection: FieldSelection<T>,
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
export async function isFieldActive<T extends object = Zaak>(
  key: string,
  field: TypedField<T>,
) {
  const fieldSelection = await getFieldSelection(key);
  return fieldSelection[field.name as keyof typeof fieldSelection];
}

/**
 * Mutates the field selection
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param fields An array containing either `TypedField` objects.
 * @param active Indicating whether the selection should be added (`true) or removed (`false).
 */
export async function _mutateFieldSelection<T extends object = Zaak>(
  key: string,
  fields: TypedField<T>[],
  active: boolean,
) {
  const currentFieldSelection = await getFieldSelection(key);
  const names = fields.map((f) => f.name);

  const fieldSelectionOverrides = names.reduce<FieldSelection<T>>(
    (partialFieldSelection, url) => ({
      ...partialFieldSelection,
      [url]: active,
    }),
    {} as FieldSelection<T>,
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
