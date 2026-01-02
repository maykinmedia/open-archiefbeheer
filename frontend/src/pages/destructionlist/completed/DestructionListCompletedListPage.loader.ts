import {
  DestructionList,
  listDestructionLists,
} from "../../../lib/api/destructionLists";
import { PaginatedResults } from "../../../lib/api/paginatedResults";
import { loginRequired } from "../../../lib/auth/loaders";

export type DestructionListCompletedListContext = {
  destructionLists: PaginatedResults<DestructionList>;
};

/**
 * React Router loader.
 * @param request
 */
export const destructionListCompletedListLoader = loginRequired(
  async ({ request }): Promise<DestructionListCompletedListContext> => {
    const searchParams = new URL(request.url).searchParams;
    const destructionLists = await listDestructionLists(
      { ...Object.fromEntries(searchParams), status: "deleted" },
      request.signal,
    );

    return {
      destructionLists,
    };
  },
);
