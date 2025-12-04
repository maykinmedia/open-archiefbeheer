import { useCallback, useEffect, useState } from "react";

import { useAlertOnError } from "./useAlertOnError";

/**
 * A generic  hook for fetching data asynchronously with TypeScript type inference.
 *
 * @template T The type of the data returned by the `fetchFunction`.
 * @template R The transformed type of the data after applying `transform` (defaults to `T`).
 *
 * @param fetchFunction - An asynchronous function that optionally accepts an `AbortSignal` and returns a Promise resolving to `T`.
 * @param config - Optional configuration object that allows customization of the hook's behavior, including polling.
 * @param deps - Dependencies array that triggers re-fetching when any dependency changes.
 * @returns `{ data, loading, error }`
 */
export function useDataFetcher<T, R = T extends undefined ? never : T>(
  fetchFunction: (signal: AbortSignal) => T | Promise<T>,
  config?: Omit<UseDataFetcherConfig<T, R | T>, "deps">,
  deps: unknown[] = [],
): {
  data: R | T;
  fetch: () => AbortController;
  loading: boolean;
  error: boolean;
} {
  const {
    errorMessage = "Er is een fout opgetreden!",
    initialState,
    transform,
  } = config ?? {};

  const alertOnError = useAlertOnError(errorMessage);
  const [data, setData] = useState<R | T>(
    (initialState as R | T) ?? (undefined as unknown as R | T),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchData = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetchFunction(signal);

      if (!signal.aborted) {
        const transformedData = transform
          ? transform(response)
          : (response as T);
        setData(transformedData as R | T);
      }
    } catch (err) {
      if (!signal.aborted) {
        setError(true);
        await alertOnError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, deps);

  // Initial fetch on mount or dependency change
  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  /**
   * Allows external control
   * @returns {AbortController}
   */
  const fetch = () => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return controller;
  };

  return { data, fetch, loading, error };
}

/**
 * Configuration options for `useDataFetcher`.
 *
 * @template T The type of the fetched data.
 * @template R The type after transformation (defaults to `T`).
 */
export interface UseDataFetcherConfig<T, R = T> {
  /**
   * The message displayed when an API call fails.
   */
  errorMessage?: string;

  /**
   * The initial value for the `data` state.
   * If provided, `data` starts with this value before fetching.
   *
   * - Useful when you want to prefill UI elements before the fetch completes.
   * - If `initialState` is `null`, TypeScript will infer `data` as `T | null`.
   */
  initialState?: R;

  /**
   * Modifies the fetched data before storing it in state.
   * This is useful for cases like:
   * - Converting API responses to a different format.
   * - Extracting specific fields from an object.
   * - Applying calculations or default values.
   *
   * @example
   * ```tsx
   * const { data } = useDataFetcher(
   *   (signal) => fetchUsers(signal),
   *   {
   *     transform: (users) => users.map(user => user.name) // Extracts names only
   *   },
   *   []
   * );
   * ```
   *
   * Defaults to no transformation, returning the raw data.
   */
  transform?: (data: T) => R;
}
