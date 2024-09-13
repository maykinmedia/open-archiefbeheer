import { useCombinedSearchParams } from "./useCombinedSearchParams";

/**
 * Hook providing sort interaction, returns: `[RESERVED, Function]` tuple.
 */
export function useSort(): [string | boolean, (sort: string) => void] {
  const [searchParams, setCombinedSearchParams] = useCombinedSearchParams();

  /**
   * Gets called when the sort order is changed.
   * Pass this to `onSort` of a DataGrid component.
   * @param sort
   */
  const setSort = (sort: string) => {
    setCombinedSearchParams({ ordering: sort });
  };

  return [searchParams.get("ordering") || true, setSort];
}
