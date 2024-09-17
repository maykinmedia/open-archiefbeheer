import { LoaderFunctionArgs } from "@remix-run/router/utils";

import { User } from "../../../lib/api/auth";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
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
      const searchParamsZakenEndpoint: Record<string, string> = {
        not_in_destruction_list: "true",
      };
      const searchParams = new URL(request.url).searchParams;

      // Update search params efficiently
      Object.entries(searchParamsZakenEndpoint).forEach(([key, value]) =>
        searchParams.set(key, value),
      );

      // Fetch reviewers, zaken, and choices concurrently
      const [zaken, reviewers] = await Promise.all([
        listZaken(searchParams),
        listReviewers(),
      ]);

      return {
        paginatedZaken: zaken,
        reviewers,
      };
    },
  ),
);
