/** Data written to session storage for every cache record. */
export type CacheRecord<T = unknown> = {
  timestamp: number;
  value: T;
};

console.log(import.meta.env.OAB_CACHE_DISABLED);
/** The cache configuration */
export const CACHE_CONFIG = {
  DISABLED:
    import.meta.env.OAB_CACHE_DISABLED?.toLowerCase() === "true" || false,
  KEY_PREFIX: import.meta.env.OAB_CACHE_PREFIX || "oab.lib.cache",
  MAX_AGE: parseInt(import.meta.env.OAB_CACHE_MAX_AGE || "600000"),
};

/**
 * Retrieves item from cache.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (CACHE_CONFIG.DISABLED) {
    return null;
  }

  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey);
  if (json === null) {
    return null;
  }

  const currentTimestamp = new Date().getTime();
  const record: CacheRecord = JSON.parse(json);

  if (currentTimestamp - record.timestamp > CACHE_CONFIG.MAX_AGE) {
    await cacheDelete(key);
    return null;
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
  if (CACHE_CONFIG.DISABLED) {
    return;
  }

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
 * @param startsWith Whether to remove cache records with a key that starts with `
 *  key` (including parameterized records).
 */
export async function cacheDelete(key: string, startsWith = false) {
  const computedKey = _getComputedKey(key);
  sessionStorage.removeItem(computedKey);

  if (!startsWith) {
    return;
  }

  // Clear related keys.
  for (const storageKey in sessionStorage) {
    if (storageKey.startsWith(computedKey)) {
      sessionStorage.removeItem(storageKey);
    }
  }
}

/**
 * Returns possible cached return value from `factory`.
 * @param key
 * @param factory
 * @param params Can only contain `boolean`, `number`, or `string` values.
 */
export async function cacheMemo<F extends (...args: never[]) => unknown>(
  key: string,
  factory: F,
  params: Parameters<F> | (string | undefined)[] = [],
): Promise<Awaited<ReturnType<F>>> {
  const _key = _getParameterizedKey(key, params);
  const cached = await cacheGet<Awaited<ReturnType<F>>>(_key);
  if (cached !== null) {
    return cached;
  }
  const value = await factory(...(params as Parameters<F>));
  await cacheSet(_key, value);
  return value as Awaited<ReturnType<F>>;
}

/**
 * Computes the prefixed cache key including the prefix.
 * @param key A key identifying the selection.
 */
function _getComputedKey(key: string): string {
  return `${CACHE_CONFIG.KEY_PREFIX}.${key}`;
}

/**
 * Returns a key (not fully computed key) containing both `key` and `params`.
 * @param key
 * @param params Can only contain `boolean`, `number`, or `string` values.
 */
function _getParameterizedKey(key: string, params?: Array<unknown>): string {
  const _params = params?.filter((v) => v);
  if (!_params || !_params.length) {
    return key;
  }
  return `${key}#${_params.join(":")}`;
}
