import { AttributeData } from "@maykin-ui/admin-ui";

import { useCombinedSearchParams } from "./useCombinedSearchParams";

/**
 * Hook providing filter interaction, returns: `[RESERVED, Function]` tuple.
 */
export function useFilter(): [object, (filterData: AttributeData) => void] {
  const [, setCombinedSearchParams] = useCombinedSearchParams();
  // Reserved for possible future expansion (filter state)
  const RESERVED = {};

  /**
   * Gets called when a filter value is changed.
   * Pass this to `onFilter` of a DataGrid component.
   * @param filterData
   */
  const setFilterField = (filterData: AttributeData) => {
    setCombinedSearchParams({
      ...(filterData as AttributeData<string>),
      page: "1",
    });
  };

  return [RESERVED, setFilterField];
}
