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
import { isZaakSelected } from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { getDestructionListReviewKey } from "./DestructionListReview";

/**
 * The context of the loader
 */
export type DestructionListReviewLoaderContext = {
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
  canReviewDestructionListRequired<DestructionListReviewLoaderContext>(
    async ({
      request,
      params,
    }: ActionFunctionArgs): Promise<DestructionListReviewLoaderContext> => {
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

      const isZaakSelectedPromises = zaken.results.map((zaak) =>
        isZaakSelected(getDestructionListReviewKey(uuid), zaak),
      );
      const isZaakSelectedResults = await Promise.all(isZaakSelectedPromises);
      const selectedZaken = zaken.results.filter(
        (_, index) => isZaakSelectedResults[index],
      );

      return {
        reviewers,
        reviewItems,
        reviewResponse,
        zaken,
        selectedZaken,
        uuid,
        destructionList: list,
      } satisfies DestructionListReviewLoaderContext;
    },
  ),
);
