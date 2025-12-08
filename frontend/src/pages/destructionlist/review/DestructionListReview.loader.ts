import { ActionFunctionArgs } from "react-router-dom";

import { User } from "../../../lib/api/auth";
import { DestructionList } from "../../../lib/api/destructionLists";
import {
  PaginatedDestructionListItems,
  listDestructionListItems,
} from "../../../lib/api/destructionListsItem";
import { Review, ReviewItemWithZaak } from "../../../lib/api/review";
import { ReviewResponse } from "../../../lib/api/reviewResponse";
import { listReviewers } from "../../../lib/api/reviewers";
import {
  canReviewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { getBaseDestructionListLoaderData } from "../abstract/loaderutils";

export type DestructionListReviewContext = {
  uuid: string;
  storageKey: string;
  destructionList: DestructionList;
  review: Review | null;
  reviewItems: ReviewItemWithZaak[] | null;
  reviewResponse: ReviewResponse | null;

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

      const base = await getBaseDestructionListLoaderData(actionFunctionArgs);
      const uuid = base.uuid;

      const searchParams = new URL(request.url).searchParams;
      searchParams.set("destruction_list", uuid); // TODO: Investigate (how) is this used, possibly affects `listDestructionListItems`?
      const objParams = Object.fromEntries(searchParams);

      const [zaken, reviewers] = await Promise.all([
        listDestructionListItems(uuid, {
          "item-order_review_ignored": true,
          ...objParams,
        }),
        listReviewers(),
      ]);

      return {
        ...base,
        paginatedZaken: zaken,
        reviewers,
      };
    },
  ),
);
