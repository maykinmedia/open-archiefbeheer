import { useCallback, useEffect, useState } from "react";

import { useAlertOnError } from "./useAlertOnError";

/**
 * A generic React hook for fetching data asynchronously with TypeScript type inference.
 *
 * This hook simplifies API data fetching while providing:
 * - State management for `data`, `loading`, and `error`.
 * - Optional data transformation via `transform`.
 * - Dependency tracking (`deps`) to refetch data when dependencies change.
 * - Custom error handling with `useAlertOnError`.
 *
 * @template T The type of the data returned by the `fetchFunction`.
 * @template R The transformed type of the data after applying `transform` (defaults to `T`).
 *
 * @param fetchFunction - An asynchronous function that returns a Promise resolving to `T`.
 * @param config - Optional configuration object.
 * @returns An object containing:
 *   - `data`: The fetched (and optionally transformed) data.
 *   - `loading`: A boolean indicating whether the fetch operation is in progress.
 *   - `error`: A boolean indicating if an error occurred.
 */
export function useDataFetcher<T, R = T extends undefined ? never : T>(
  fetchFunction: () => Promise<T>,
  config?: UseDataFetcherConfig<T, R | T>,
): { data: R | T; loading: boolean; error: boolean } {
  const {
    deps = [],
    errorMessage = "Er is een fout opgetreden!",
    initialState,
    transform,
  } = config ?? {};

  const alertOnError = useAlertOnError(errorMessage);

  /**
   * `data` state:
   * - Initially set to `initialState` if provided.
   * - If `initialState` is `null`, TypeScript infers `data` as `T | null` automatically.
   * - If `transform` is provided, `data` will be of type `R | T` (allowing transformation).
   */
  const [data, setData] = useState<R | T>(
    (initialState as R | T) ?? (undefined as unknown as R | T),
  );

  // State to track loading and errors
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  /**
   * Fetches data from the provided `fetchFunction`, handling loading, errors, and transformation.
   */
  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);

    fetchFunction()
      .then((result) => {
        // Apply transformation if `transform` exists, otherwise use raw result
        const transformedData = transform ? transform(result) : (result as T);
        setData(transformedData as R | T);
      })
      .catch((err) => {
        setError(true);
        alertOnError(err);
      })
      .finally(() => setLoading(false));
  }, deps);

  // Fetch data when the component mounts or `deps` change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error };
}

/**
 * Configuration options for `useDataFetcher`.
 *
 * @template T The type of the fetched data.
 * @template R The type after transformation (defaults to `T`).
 */
export interface UseDataFetcherConfig<T, R = T> {
  /** Dependencies that trigger re-fetching when changed. Default is `[]`. */
  deps?: unknown[];

  /** Error message displayed when an API call fails. */
  errorMessage?: string;

  /** Initial value for the `data` state. */
  initialState?: R;

  /** Optional transformation function to modify data before storing it in state. */
  transform?: (data: T) => R;
}
