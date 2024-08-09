import { LoaderFunctionArgs } from "@remix-run/router/utils";

import { User } from "../../../lib/api/auth";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canStartDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { getSessionHash } from "../../../lib/hash/hash";
import { getZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { DEFAULT_STORAGE_KEY } from "./DestructionListCreate";
import "./DestructionListCreate.css";

export type DestructionListCreateContext = {
  reviewers: User[];
  selectedZaken: Zaak[];
  sessionHash: string | null;
  zaken: PaginatedZaken;
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
      const sessionHash = await getSessionHash();
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
      const zaakSelection = await getZaakSelection(
        sessionHash || DEFAULT_STORAGE_KEY,
        Boolean(sessionHash),
      );
      const selectedZaken = zaken.results.filter(
        (zaak) =>
          zaakSelection.items.find((i) => i.zaak === zaak.url)?.selected,
      );

      return {
        reviewers,
        selectedZaken,
        sessionHash: await getSessionHash(),
        zaken,
      };
    },
  ),
);
