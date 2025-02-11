import { LoaderFunctionArgs } from "@remix-run/router/utils";

import { User } from "../../../lib/api/auth";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, searchZaken } from "../../../lib/api/zaken";
import {
  canStartDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";

export type DestructionListCreateContext = {
  paginatedZaken: PaginatedZaken;
  reviewers: User[];
};

/**
 * React Router loader.
 * @param request
 */
export const destructionListCreateLoader = loginRequired(
  canStartDestructionListRequired(
    async ({
      request,
    }: LoaderFunctionArgs): Promise<DestructionListCreateContext> => {
      const searchParams = new URL(request.url).searchParams;

      const searchParamsZakenEndpoint: Record<string, string> = {
        not_in_destruction_list: "true",
      };

      for (const [key, value] of searchParams) {
        searchParamsZakenEndpoint[key] = value;
      }
      searchParams.set("not_in_destruction_list", "true");

      // Fetch reviewers, zaken, and choices concurrently
      const [zaken, reviewers] = await Promise.all([
        searchZaken(searchParamsZakenEndpoint),
        listReviewers(),
      ]);

      return {
        paginatedZaken: zaken,
        reviewers,
      };
    },
  ),
);
