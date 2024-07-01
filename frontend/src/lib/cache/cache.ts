/** The maximum default cache age. */
export const DEFAULT_CACHE_MAX_AGE = 600000;

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

/** Factory function used to create a cachable value. */
export type CacheFactory<T> = (params?: CacheParams) => Promise<T>;

/** Optional parameters passed to a cache factory, and used to generate a cache key. */
export type CacheParams = Array<boolean | number | string>;

/**
 * Returns possible cached return value from `factory`.
 * @param key
 * @param factory
 * @param params Can only contain `boolean`, `number`, or `string` values.
 */
export async function cacheMemo<T>(
  key: string,
  factory: CacheFactory<T>,
  params?: Array<boolean | number | string>,
): Promise<T> {
  const _key = _getCompiledKey(key, params);
  const cached = await cacheGet<T>(_key);
  if (cached !== null) {
    return cached;
  }
  const value = await factory(params);
  await cacheSet(_key, value);
  return value;
}

/**
 * Computes the prefixed cache key.
 * @param key A key identifying the selection.
 */
function _getComputedKey(key: string): string {
  return `oab.lib.cache.${key}`;
}

/**
 * Returns a key (not computed key) containing both `key` and `params`.
 * @param key
 * @param params Can only contain `boolean`, `number`, or `string` values.
 */
function _getCompiledKey(
  key: string,
  params?: Array<boolean | number | string>,
): string {
  if (!params) {
    return key;
  }
  return `${key}#${params.join(":")}`;
}
