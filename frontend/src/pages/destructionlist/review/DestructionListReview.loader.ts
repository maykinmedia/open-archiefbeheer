import { ActionFunctionArgs } from "react-router-dom";

import { User } from "../../../lib/api/auth";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  ReviewItem,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import {
  ReviewResponse,
  getLatestReviewResponse,
} from "../../../lib/api/reviewResponse";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canReviewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { getZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { getDestructionListReviewKey } from "./DestructionListReview";

export type DestructionListReviewContext = {
  reviewers: User[];
  reviewItems?: ReviewItem[];
  reviewResponse?: ReviewResponse;
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  uuid: string;
  destructionList: DestructionList;
};

/**
 * React Router loader.
 * @param request
 * @param params
 */
export const destructionListReviewLoader = loginRequired(
  canReviewDestructionListRequired<DestructionListReviewContext>(
    async ({
      request,
      params,
    }: ActionFunctionArgs): Promise<DestructionListReviewContext> => {
      const searchParams = new URL(request.url).searchParams;
      const uuid = params.uuid as string;
      searchParams.set("destruction_list", uuid);
      const objParams = Object.fromEntries(searchParams);

      const zakenPromise = listZaken({
        ...objParams,
        in_destruction_list: uuid,
      });
      const listsPromise = getDestructionList(uuid);
      const reviewersPromise = listReviewers();
      const latestReview = await getLatestReview({
        destructionList__uuid: uuid,
      });
      const reviewItemsPromise = latestReview
        ? listReviewItems({ review: latestReview.pk })
        : undefined;

      const reviewResponsePromise = latestReview
        ? getLatestReviewResponse({
            review: latestReview.pk,
          })
        : undefined;

      const [zaken, list, reviewers, reviewItems, reviewResponse] =
        await Promise.all([
          zakenPromise,
          listsPromise,
          reviewersPromise,
          reviewItemsPromise,
          reviewResponsePromise,
        ]);

      // Get zaak selection.
      const zaakSelection = await getZaakSelection(
        getDestructionListReviewKey(uuid),
        false,
      );
      const selectedZaken = zaken.results.filter(
        (zaak) =>
          zaakSelection.items.find((i) => i.zaak === (zaak.url as string))
            ?.selected,
      );

      return {
        reviewers,
        reviewItems,
        reviewResponse,
        zaken,
        selectedZaken,
        uuid,
        destructionList: list,
      } satisfies DestructionListReviewContext;
    },
  ),
);
