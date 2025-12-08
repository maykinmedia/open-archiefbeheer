import { invariant } from "@maykin-ui/client-common";
import { ActionFunctionArgs } from "@remix-run/router/utils";

import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  Review,
  ReviewItem,
  ReviewItemWithZaak,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import { getLatestReviewResponse } from "../../../lib/api/reviewResponse";
import { getDestructionListReviewKey } from "../review";

/**
 * Base loader data for destruction list detail/review views.
 * @param request
 * @param params
 */
export async function getBaseDestructionListLoaderData({
  request,
  params,
}: ActionFunctionArgs) {
  invariant(params.uuid, "params.uuid not set!");
  const uuid = params.uuid;
  const searchParams = new URL(request.url).searchParams;

  const destructionList = await getDestructionList(uuid as string);
  const storageKey = getDestructionListStorageKey(destructionList);
  const review = await getReview(destructionList);
  const reviewResponse = review
    ? (await getReviewResponse(review)) ?? null
    : null;

  const reviewItems = await getReviewItems(
    destructionList,
    review,
    searchParams,
  );

  return {
    uuid,
    storageKey: storageKey,
    destructionList,
    review,
    reviewItems,
    reviewResponse,
  };
}

/**
 * Returns the "storage key" for a specific destruction list.
 * The storage key is used to associated various storages with a destruction
 * list.
 * @param destructionList
 */
export function getDestructionListStorageKey(
  destructionList: DestructionList,
): string {
  switch (destructionList.status) {
    case "ready_to_review":
    case "ready_for_archivist":
      return getDestructionListReviewKey(
        destructionList.uuid,
        destructionList.status,
      );
    default:
      return `destruction-list-detail-${destructionList.uuid}-${destructionList.status}`;
  }
}

/**
 * Returns the latest `Review` (if any) or `null` (if none) for `destructionList`.
 * @param destructionList
 */
export async function getReview(
  destructionList: DestructionList,
): Promise<Review | null> {
  return getLatestReview({
    destructionList__uuid: destructionList.uuid,
  });
}

/**
 * Returns the review items for `Review` (if any) if required by `DestructionList.status`.
 * @param destructionList
 * @param review
 * @param searchParams
 */
export async function getReviewItems(
  destructionList: DestructionList,
  review: Review | null,
  searchParams: URLSearchParams,
): Promise<ReviewItemWithZaak[] | null> {
  // Construct full params including fitter etc.
  const objectParams = Object.fromEntries(searchParams);
  const params = {
    ...objectParams,
    "item-review-review": review?.pk,
  };

  switch (destructionList.status) {
    // "changes_requested" should always have a review.
    case "changes_requested":
      invariant(
        review,
        'DestructionList with statues "changes_requested" must have a Review!',
      );
      return (await listReviewItems(params)).filter(
        (item: ReviewItem | ReviewItemWithZaak): item is ReviewItemWithZaak =>
          !!item.zaak,
      );

    // "ready_to_review" may not have a review.
    case "ready_to_review":
    case "ready_for_archivist":
      return review
        ? (await listReviewItems(params)).filter(
            (
              item: ReviewItem | ReviewItemWithZaak,
            ): item is ReviewItemWithZaak => !!item.zaak,
          )
        : null;

    // Review items not needed.
    default:
      return null;
  }
}

/**
 * Return the `ReviewResponse` (if any) for `review`.
 * @param review
 */
export async function getReviewResponse(review: Review) {
  return getLatestReviewResponse({
    review: review.pk,
  });
}
