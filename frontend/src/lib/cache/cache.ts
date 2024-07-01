/** The maximum default cache age. */
const DEFAULT_CACHE_MAX_AGE = 600000;

/** Data written to session storage for every cache record. */
export type CacheRecord<T = unknown> = {
  timestamp: number;
  value: T;
};

/**
 * Retrieves item from cache.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey);
  if (json === null) {
    return null;
  }

  const currentTimestamp = new Date().getTime();
  const record: CacheRecord = JSON.parse(json);

  if (currentTimestamp - record.timestamp > DEFAULT_CACHE_MAX_AGE) {
    await cacheDelete(computedKey);
  }

  return JSON.parse(json).value as T;
}

/**
 * Add item to cache.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection.
 * @param value THe value to cache.
 */
export async function cacheSet(key: string, value: unknown) {
  const computedKey = _getComputedKey(key);
  const record: CacheRecord = {
    timestamp: new Date().getTime(),
    value: value,
  };
  const json = JSON.stringify(record);
  sessionStorage.setItem(computedKey, json);
}

/**
 * Removes item from cache.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection.
 */
export async function cacheDelete(key: string) {
  const computedKey = _getComputedKey(key);
  sessionStorage.removeItem(computedKey);
}

/**
 * Returns possible cached return value from `factory`.
 * @param key
 * @param factory
 */
export async function cacheMemo<T>(
  key: string,
  factory: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  const value = await factory();
  await cacheSet(key, value);
  return value;
}

/**
 * Computes the prefixed cache key.
 * @param key A key identifying the selection
 */
function _getComputedKey(key: string): string {
  return `oab.lib.cache.${key}`;
}
