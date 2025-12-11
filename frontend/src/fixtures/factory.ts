import { RecursivePartial } from "../lib/types/utilities";

/**
 * Generic factory function to create individual objects with default and overridden properties
 * @param {T} defaultValues - Default values for the object
 * @returns {(overrides?: RecursivePartial<T>) => T} - Function to create objects with specified properties
 */
export const createObjectFactory = <T>(defaultValues: T) => {
  return (overrides: RecursivePartial<T> = {}): T => {
    return Object.assign({}, defaultValues, overrides);
  };
};

/**
 * Generic factory function to create arrays of objects with default and overridden properties.
 *
 * The returned function merges each default object with the corresponding override object by index.
 * - The length of the resulting array is the **maximum of `defaultValues.length` and `overrides.length`**.
 * - If `overrides` contains more items than `defaultValues`, the **last default object** is used as a template for additional items.
 * - If `overrides` is shorter than `defaultValues`, the remaining default objects are included unchanged.
 *
 * @template T - Type of the objects in the array
 * @param {T[]} defaultValues - Array of default objects to use as a base
 * @returns {(overrides?: RecursivePartial<T>[]) => T[]} Function that generates a new array with optional overrides
 */
export const createArrayFactory = <T extends object>(
  defaultValues: T[],
): ((overrides?: RecursivePartial<T>[]) => T[]) => {
  return (overrides: RecursivePartial<T>[] = []): T[] => {
    const length = Math.max(defaultValues.length, overrides.length);

    return Array.from({ length }, (_, index) => {
      const target =
        defaultValues[index] ?? defaultValues[defaultValues.length - 1];
      return Object.assign({}, target, overrides[index] ?? {});
    });
  };
};
