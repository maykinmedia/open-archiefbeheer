/**
 * Converts URLSearchParams/Record to object.
 * @param params - URLSearchParams or an object.
 */
export function params2Object(
  params: URLSearchParams | Record<string | number, unknown>,
): Record<string, string> {
  const entries = params2Entries(params);
  return Object.fromEntries(entries);
}
/**
 * Converts URLSearchParams/Record to cache key string.
 * @param params - URLSearchParams or an object.
 */
export function params2CacheKey(
  params: URLSearchParams | Record<string | number, unknown>,
): string {
  const entries = params2Entries(params);
  return entries2CacheKey(entries);
}

/**
 * Converts URLSearchParams/Record to entries array.
 * @param params - URLSearchParams or an object.
 */
export function params2Entries(
  params: URLSearchParams | Record<string | number, unknown>,
): [string, string][] {
  return params instanceof URLSearchParams
    ? [...params.entries()]
    : Object.entries(params || {}).map(([k, v]) => [String(k), String(v)]);
}
/**
 * Converts entries array to cache key string;
 * @param entries - An array of `[string, string]` entries.
 */
export function entries2CacheKey(entries: [string, string][]): string {
  return entries
    .map((entry) => entry.join("="))
    .sort()
    .join(":");
}
