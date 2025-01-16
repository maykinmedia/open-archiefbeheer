/**
 * Takes an errors object and returns a `string[]` with correct messages.
 * @param errors
 */
export function collectErrors(errors: string | object): string[] {
  if (typeof errors === "string") {
    return [errors];
  }
  const flatten = Object.values(errors || {}).flat();
  return flatten.reduce((acc, val) => [...acc, ...collectErrors(val)], []);
}
