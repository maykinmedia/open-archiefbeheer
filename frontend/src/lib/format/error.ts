/**
 * Takes an errors object and returns a `string[]` with correct messages.
 * Filters out irrelevant error codes like "session_expired".
 * @param errors The error response body.
 * @returns A list of error messages.
 */
export function collectErrors(errors: string | object): string[] {
  if (typeof errors === "string") {
    return [errors];
  }

  const flatten = Object.entries(errors || {})
    .filter(([key]) => !["key", "code"].includes(key))
    .map(([, value]) => value)
    .flat();

  return flatten.reduce((acc, val) => [...acc, ...collectErrors(val)], []);
}
