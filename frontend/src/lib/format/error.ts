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

  const flatten = Object.values(errors || {})
    .flat()
    .filter((error) => !["key", "code"].includes(error));
  return flatten.reduce((acc, val) => [...acc, ...collectErrors(val)], []);
}
