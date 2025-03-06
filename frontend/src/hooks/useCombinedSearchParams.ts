import { useRef } from "react";
import { SetURLSearchParams, useSearchParams } from "react-router-dom";

/**
 * Wraps `useSearchParams()`, combines instead of replaces current URLSearchParams.
 */
export function useCombinedSearchParams(): ReturnType<typeof useSearchParams> {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Updates combined `searchParams`.
   * @param params
   * @private
   */
  const setCombinedSearchParams: SetURLSearchParams = (params) => {
    const handle = () => {
      const combinedParams = {
        ...Object.fromEntries(searchParams),
        ...(params as Record<string, string>),
      };

      const activeParams = Object.fromEntries(
        Object.entries(combinedParams).filter(
          (keyValuePair) => keyValuePair[1],
        ),
      );
      setSearchParams(new URLSearchParams(activeParams));
    };
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handle, 100);
  };

  return [searchParams, setCombinedSearchParams];
}
