import { ActionFunctionArgs } from "react-router-dom";

import { User } from "../../../lib/api/auth";
import { DestructionList } from "../../../lib/api/destructionLists";
import {
  PaginatedDestructionListItems,
  listDestructionListItems,
} from "../../../lib/api/destructionListsItem";
import { Review, ReviewItem } from "../../../lib/api/review";
import { ReviewResponse } from "../../../lib/api/reviewResponse";
import { listReviewers } from "../../../lib/api/reviewers";
import {
  canReviewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { getBaseDestructionListLoaderData } from "../abstract/loaderutils";

export type DestructionListReviewContext = {
  destructionList: DestructionList;
  review: Review | null;
  reviewItems: ReviewItem[] | null;
  reviewResponse: ReviewResponse | null;
  storageKey: string;
  user: User;
  uuid: string;

  paginatedZaken: PaginatedDestructionListItems;
  reviewers: User[];
};

/**
 * React Router loader.
 * @param request
 * @param params
 */
export const destructionListReviewLoader = loginRequired(
  canReviewDestructionListRequired<DestructionListReviewContext>(
    async (
      actionFunctionArgs: ActionFunctionArgs,
    ): Promise<DestructionListReviewContext> => {
      const { request } = actionFunctionArgs;

      const searchParams = new URL(request.url).searchParams;
      const objParams = Object.fromEntries(searchParams);

      const {
        uuid,
        storageKeyPromise,
        destructionListPromise,
        reviewPromise,
        reviewItemsPromise,
        reviewResponsePromise,
        userPromise,
      } = await getBaseDestructionListLoaderData(actionFunctionArgs);

      searchParams.set("destruction_list", uuid); // TODO: Investigate (how) is this used, possibly affects `listDestructionListItems`?

      const [
        destructionList,
        review,
        reviewItems,
        reviewResponse,
        storageKey,
        user,

        zaken,
        reviewers,
      ] = await Promise.all([
        destructionListPromise,
        reviewPromise,
        reviewItemsPromise,
        reviewResponsePromise,
        storageKeyPromise,
        userPromise,
        listDestructionListItems(uuid, {
          "item-order_review_ignored": true,
          ...objParams,
        }),
        listReviewers(),
      ]);

      return {
        destructionList,
        review,
        reviewItems,
        reviewResponse,
        storageKey,
        user,
        uuid,

        paginatedZaken: zaken,
        reviewers,
      };
    },
  ),
);
