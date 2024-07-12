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
 * Generic factory function to create arrays of objects with default and overridden properties
 * @param {T[]} defaultValues - Default values for the array of objects
 * @returns {(overrides?: RecursivePartial<T>[]) => T[]} - Function to create arrays of objects with specified properties
 */
export const createArrayFactory = <T>(defaultValues: T[]) => {
  return (overrides: RecursivePartial<T>[] = []): T[] => {
    return defaultValues.map((defaultItem, index) =>
      Object.assign({}, defaultItem, overrides[index]),
    );
  };
};
