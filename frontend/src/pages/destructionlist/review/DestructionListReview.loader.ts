import { ActionFunctionArgs } from "react-router-dom";

import { AuditLogItem, listAuditLog } from "../../../lib/api/auditLog";
import { User } from "../../../lib/api/auth";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  PaginatedDestructionListItems,
  listDestructionListItems,
} from "../../../lib/api/destructionListsItem";
import {
  Review,
  ReviewItemWithZaak,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import {
  ReviewResponse,
  getLatestReviewResponse,
} from "../../../lib/api/reviewResponse";
import { listReviewers } from "../../../lib/api/reviewers";
import {
  canReviewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { getDestructionListReviewKey } from "./DestructionListReview";

export type DestructionListReviewContext = {
  storageKey: string;

  uuid: string;
  destructionList: DestructionList;
  logItems: AuditLogItem[];

  paginatedZaken: PaginatedDestructionListItems;
  review: Review;
  reviewItems?: ReviewItemWithZaak[];
  reviewResponse?: ReviewResponse;
  reviewers: User[];
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

      const [list, logItems, reviewItems, reviewResponse, reviewers, zaken] =
        await Promise.all([
          getDestructionList(uuid),
          listAuditLog(uuid),
          reviewItemsPromise,
          reviewResponsePromise,
          listReviewers(),
          listDestructionListItems(uuid, {
            "item-order_review_ignored": String(true),
            ...(objParams as unknown as URLSearchParams),
          }),
        ]);

      const storageKey = getDestructionListReviewKey(uuid, list.status);

      // #378 - If for some unfortunate reason a zaak has been deleted outside of the process,
      // item.zaak can be null
      // TODO refactor: This code is the same as for the DestructionListDetail loader.
      const reviewItemsWithZaak = reviewItems
        ? (reviewItems.filter((item) => !!item.zaak) as ReviewItemWithZaak[])
        : reviewItems;
      console.log({ reviewResponse, zaken, objParams });

      return {
        storageKey,

        uuid,
        destructionList: list,
        logItems,

        paginatedZaken: zaken,
        review: latestReview,
        reviewItems: reviewItemsWithZaak,
        reviewResponse,
        reviewers,
      } satisfies DestructionListReviewContext;
    },
  ),
);
