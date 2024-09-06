import { LoaderFunctionArgs } from "@remix-run/router/utils";

import { User } from "../../../lib/api/auth";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canStartDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import {
  getAllZakenSelected,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import {
  DESTRUCTION_LIST_CREATE_KEY,
  DestructionListCreateContext,
} from "./DestructionListCreate";
import "./DestructionListCreate.css";

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
      Object.keys(searchParamsZakenEndpoint).forEach((key) =>
        searchParams.set(key, searchParamsZakenEndpoint[key]),
      );

      // Get reviewers, zaken and zaaktypen.
      const promises = [listReviewers(), listZaken(searchParams)];
      const [reviewers, zaken] = (await Promise.all(promises)) as [
        User[],
        PaginatedZaken,
      ];

      // Get zaak selection.
      const zaakSelection = await getZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
      const allZakenSelected = await getAllZakenSelected(
        DESTRUCTION_LIST_CREATE_KEY,
      );

      return { reviewers, zaken, zaakSelection, allZakenSelected };
    },
  ),
);
