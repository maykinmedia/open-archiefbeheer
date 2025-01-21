type StoredPreference<T> = T extends string
  ? { type: "string"; value: string }
  : T extends number
    ? { type: "number"; value: string }
    : T extends bigint
      ? { type: "bigint"; value: string }
      : T extends boolean
        ? { type: "boolean"; value: string }
        : T extends null
          ? { type: "null"; value: string }
          : T extends object
            ? { type: "json"; value: string }
            : never;

/**
 * Gets the preference.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 */
export async function getPreference<
  T extends string | number | bigint | boolean | null | object,
>(key: string): Promise<T | undefined> {
  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey);

  if (!json) {
    return undefined;
  }

  const { type, value } = JSON.parse(json) as StoredPreference<T>;

  switch (type) {
    case "string":
      return value as T;
    case "number":
      return Number(value) as T;
    case "bigint":
      return BigInt(value) as T;
    case "boolean":
      return Boolean(value) as T;
    case "null":
      return null as T;
    case "json":
      return JSON.parse(value);
  }
}

/**
 * Sets preference cache.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param value
 */
export async function setPreference<
  T extends string | number | bigint | boolean | null | object,
>(key: string, value: T) {
  const computedKey = _getComputedKey(key);
  const type =
    value === null ? "null" : typeof value === "object" ? "json" : typeof value;
  const jsonValue = type === "json" ? JSON.stringify(value) : value;

  switch (type) {
    case "function":
      throw new Error("Function values are not supported as preference.");
    case "symbol":
      throw new Error("Symbol values are not supported as preference.");
    default: {
      const storedPreference: StoredPreference<T> = {
        type: type,
        value: jsonValue,
      } as StoredPreference<T>;
      const json = JSON.stringify(storedPreference);
      sessionStorage.setItem(computedKey, json);
    }
  }
}

/**
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 */
export async function clearPreference(key: string) {
  const computedKey = _getComputedKey(key);
  sessionStorage.removeItem(computedKey);
}

/**
 * Computes the prefixed cache key.
 * @param key A key identifying the selection
 */
function _getComputedKey(key: string): string {
  return `oab.lib.preference.${key}`;
}
