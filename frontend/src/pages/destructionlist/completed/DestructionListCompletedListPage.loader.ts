import {
  DestructionList,
  listCompletedDestructionLists,
} from "../../../lib/api/destructionLists";
import { PaginatedResults } from "../../../lib/api/paginatedResults";
import {
  canStartDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";

export type DestructionListCompletedListContext = {
  destructionLists: PaginatedResults<DestructionList>;
};

/**
 * React Router loader.
 * @param request
 */
export const destructionListCompletedListLoader = loginRequired(
  canStartDestructionListRequired(
    async ({ request }): Promise<DestructionListCompletedListContext> => {
      const searchParams = new URL(request.url).searchParams;
      const destructionLists = await listCompletedDestructionLists(
        searchParams,
        request.signal,
      );

      return {
        destructionLists,
      };
    },
  ),
);
