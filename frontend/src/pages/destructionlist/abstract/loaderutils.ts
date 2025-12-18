import { invariant } from "@maykin-ui/client-common";
import { ActionFunctionArgs } from "@remix-run/router/utils";

import { whoAmI } from "../../../lib/api/auth";
import {
  DestructionList,
  DestructionListStatus,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  Review,
  ReviewItem,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import { getLatestReviewResponse } from "../../../lib/api/reviewResponse";
import { getDestructionListReviewKey } from "../review";

/**
 * Base loader data for destruction list detail/review views.
 * @param request
 * @param params
 * @param review - Whether the data is for a review page.
 */
export async function getBaseDestructionListLoaderData({
  request,
  params,
}: ActionFunctionArgs) {
  invariant(params.uuid, "params.uuid not set!");
  const uuid = params.uuid;

  const searchParams = new URL(request.url).searchParams;

  const destructionListPromise = getDestructionList(uuid as string);
  const storageKeyPromise = getDestructionListStorageKey(
    destructionListPromise,
  );
  const reviewPromise = getReview(destructionListPromise);
  const reviewItemsPromise = getReviewItems(
    destructionListPromise,
    reviewPromise,
    searchParams,
  );
  const reviewResponsePromise = getReviewResponse(reviewPromise);

  const userPromise = whoAmI();

  return {
    uuid,
    storageKeyPromise,
    destructionListPromise,
    reviewPromise,
    reviewItemsPromise,
    reviewResponsePromise,
    userPromise,
  };
}

/**
 * Returns the "storage key" for a specific destruction list.
 * The storage key is used to associate various storages with a destruction
 * list.
 * @param destructionListPromise
 */
export async function getDestructionListStorageKey(
  destructionListPromise: Promise<DestructionList>,
) {
  const { uuid, status } = await destructionListPromise;

  switch (status) {
    case "ready_to_review":
    case "ready_for_archivist":
      return getDestructionListReviewKey(uuid, status);
  }
  return `destruction-list-detail-${uuid}-${status}`;
}

/**
 * Returns the latest `Review` (if any) or `null` (if none) for `destructionList`.
 * @param destructionListPromise
 */
export async function getReview(
  destructionListPromise: Promise<DestructionList>,
): Promise<Review | null> {
  return destructionListPromise.then((destructionList) =>
    getLatestReview({
      destructionList__uuid: destructionList.uuid,
    }),
  );
}

/**
 * Returns the review items for `Review` (if any) if required by `DestructionList.status`.
 * @param destructionListPromise
 * @param reviewPromise
 * @param searchParams
 */
export async function getReviewItems(
  destructionListPromise: Promise<DestructionList>,
  reviewPromise: Promise<Review | null>,
  searchParams: URLSearchParams,
): Promise<ReviewItem[] | null> {
  // Construct full params including fitter etc.
  const destructionList = await destructionListPromise;
  const supportedStatuses: DestructionListStatus[] = [
    "changes_requested",
    "ready_to_review",
    "ready_for_archivist",
  ];

  // Items not needed.
  if (!supportedStatuses.includes(destructionList.status)) {
    return null;
  }

  const objectParams = Object.fromEntries(searchParams);
  const review = await reviewPromise;
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
        (item: ReviewItem) => !!item.destructionListItem.zaak,
      );

    // "ready_to_review" may not have a review.
    case "ready_to_review":
    case "ready_for_archivist":
      return review
        ? (await listReviewItems(params)).filter(
            (item: ReviewItem): item is ReviewItem =>
              !!item.destructionListItem.zaak,
          )
        : null;
  }

  invariant(false, "getReviewItems() was inconclusive!");
}

/**
 * Return the `ReviewResponse` (if any) for `review`.
 * @param reviewPromise
 */
export async function getReviewResponse(reviewPromise: Promise<Review | null>) {
  return reviewPromise.then((review) =>
    review
      ? getLatestReviewResponse({
          review: review.pk,
        }).then((reviewResponse) => reviewResponse ?? null)
      : null,
  );
}
