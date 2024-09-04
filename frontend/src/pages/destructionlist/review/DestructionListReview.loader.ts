import { ActionFunctionArgs } from "react-router-dom";

import { AuditLogItem, listAuditLog } from "../../../lib/api/auditLog";
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
  getFilteredZaakSelection,
  getZaakSelection,
  getZaakSelectionItem,
  isZaakSelected,
} from "../../../lib/zaakSelection/zaakSelection";
import { getDestructionListReviewKey } from "./DestructionListReview";

export type DestructionListReviewContext = {
  uuid: string;
  destructionList: DestructionList;
  logItems: AuditLogItem[];

  review: Review;
  reviewItems?: ReviewItem[];
  reviewResponse?: ReviewResponse;

  reviewers: User[];

  zaken: PaginatedZaken;
  approvedZaakUrlsOnPage: string[];
  excludedZaakSelection: ZaakSelection<{ approved: false; comment?: string }>;
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
      const storageKey = getDestructionListReviewKey(uuid);

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
          listZaken({
            ...objParams,
            in_destruction_list: uuid,
          }),
        ]);

      const zaakSelection = await getZaakSelection<{ approved: boolean }>(
        storageKey,
      );

      const zakenOnPage = reviewItems?.length
        ? reviewItems.map((ri) => ri.zaak.url as string)
        : zaken.results.map((z) => z.url as string);

      const approvedZaakUrlsOnPagePromise = await Promise.all(
        zakenOnPage.map(async (url) => {
          const item = await getZaakSelectionItem<typeof zaakSelection>(
            storageKey,
            url,
          );
          console.log(1, { item });
          return { url, approved: item?.detail?.approved };
        }),
      );

      const approvedZaakUrlsOnPage = approvedZaakUrlsOnPagePromise
        .filter((result) => result.approved)
        .map((result) => result.url);

      const excludedZaakSelection = await getFilteredZaakSelection<{
        approved: false;
      }>(storageKey, { approved: false });

      return {
        uuid,
        destructionList: list,
        logItems,

        review: latestReview,
        reviewItems,
        reviewResponse,

        reviewers,

        zaken,
        approvedZaakUrlsOnPage,
        excludedZaakSelection,
      } satisfies DestructionListReviewContext;
    },
  ),
);
