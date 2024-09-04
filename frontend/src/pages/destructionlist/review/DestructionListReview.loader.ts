import { ActionFunctionArgs } from "react-router-dom";

import { User } from "../../../lib/api/auth";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  Review,
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
import {
  ZaakSelection,
  getZaakSelection,
  isZaakSelected,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { getDestructionListReviewKey } from "./DestructionListReview";

export type DestructionListReviewContext = {
  review: Review;
  reviewers: User[];
  reviewItems?: ReviewItem[];
  reviewResponse?: ReviewResponse;
  zaken: PaginatedZaken;
  zaakSelection: ZaakSelection;
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
        ? listReviewItems({ "item-review-review": latestReview.pk })
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

      const zaakSelection = await getZaakSelection(
        getDestructionListReviewKey(uuid),
      );

      return {
        review: latestReview,
        reviewers,
        reviewItems,
        reviewResponse,
        zaken,
        zaakSelection,
        uuid,
        destructionList: list,
      } satisfies DestructionListReviewContext;
    },
  ),
);
