import { LoaderFunctionArgs } from "@remix-run/router/utils";

import { User } from "../../../lib/api/auth";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canStartDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import {
  ZaakSelection,
  getAllZakenSelected,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { DESTRUCTION_LIST_CREATE_KEY } from "./DestructionListCreate";
import "./DestructionListCreate.css";

export type DestructionListCreateContext = {
  paginatedZaken: PaginatedZaken;
  reviewers: User[];
  zaakSelection: ZaakSelection; // FIXME
  allZakenSelected: boolean; // FIXME
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
      const [reviewers, zaken, zaakSelection, allZakenSelected] =
        await Promise.all([
          listReviewers(),
          listZaken(searchParams),
          getZaakSelection(DESTRUCTION_LIST_CREATE_KEY),
          getAllZakenSelected(DESTRUCTION_LIST_CREATE_KEY),
        ]);

      return {
        paginatedZaken: zaken,
        reviewers,
        zaakSelection, // FIXME
        allZakenSelected, // FIXME
      };
    },
  ),
);
