import { useCombinedSearchParams } from "./useCombinedSearchParams";

/**
 * Hook providing filter interaction, returns: `[RESERVED, Function]` tuple.
 */
export function useFilter<T extends object>(): [
  object,
  (filterData: T) => void,
] {
  const [, setCombinedSearchParams] = useCombinedSearchParams();
  // Reserved for possible future expansion (filter state)
  const RESERVED = {};

  /**
   * Gets called when a filter value is changed.
   * Pass this to `onFilter` of a DataGrid component.
   * @param filterData
   */
  const setFilterField = (filterData: T) => {
    setCombinedSearchParams({
      ...(filterData as object),
      page: "1",
    });
  };

  return [RESERVED, setFilterField];
}
