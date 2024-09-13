import { useCombinedSearchParams } from "./useCombinedSearchParams";

/**
 * Hook providing page interaction, returns: `[number, Function]` tuple.
 */
export function usePage(): [number, (page: number) => void] {
  const [searchParams, setCombinedSearchParams] = useCombinedSearchParams();

  /**
   * Gets called when the page number is changed.
   * Pass this to `onPageChange` of a DataGrid component.
   * @param page
   */
  const setPage = (page: number) => {
    setCombinedSearchParams({
      page: String(page),
    });
  };

  return [Number(searchParams.get("page") || 1), setPage];
}
