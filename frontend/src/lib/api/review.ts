import { User } from "./auth";
import { DestructionList } from "./destructionLists";
import { DestructionListItem } from "./destructionListsItem";
import { request } from "./request";

export type Review = {
  destructionList: string;
  decision: "accepted" | "rejected" | "ignored_review";
  listFeedback: string;
  pk?: number;
  author?: User;
  created?: string;
  zakenReviews?: ZaakReview[];
};

export type ZaakReview = {
  zaakUrl: string;
  feedback: string;
};

export type ReviewItem = {
  pk: number;
  destructionListItem: DestructionListItem;
  feedback: string;
};

/**
 * Create a new destruction list review
 */
export async function createDestructionListReview(
  { ...data }: Review,
  signal?: AbortSignal,
) {
  const response = await request(
    "POST",
    "/destruction-list-reviews/",
    undefined,
    {
      ...data,
    },
    undefined,
    signal,
  );
  const promise: Promise<unknown> = response.json();
  return promise;
}

/**
 * Get the latest review for a destruction list.
 */
export async function getLatestReview(
  params?:
    | URLSearchParams
    | {
        decision?: Review["decision"];
        destructionList?: DestructionList["pk"];
        destructionList__uuid?: DestructionList["uuid"];
      },
  signal?: AbortSignal,
): Promise<Review | null> {
  const reviews = await listReviews(
    { ...params, ordering: "-created" },
    signal,
  );
  return reviews[0] ?? null;
}

/**
 * List all the reviews that have been made for a destruction list.
 */
export async function listReviews(
  params?:
    | URLSearchParams
    | {
        decision?: Review["decision"];
        destructionList?: DestructionList["pk"];
        destructionList__uuid?: DestructionList["uuid"];
        ordering?: "-created" | "created";
      },
  signal?: AbortSignal,
) {
  const response = await request(
    "GET",
    "/destruction-list-reviews/",
    params,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<Review[]> = response.json();
  return promise;
}

/**
 * List all the reviews that have been made for a destruction list.
 */
export async function listReviewItems(
  params?:
    | URLSearchParams
    | {
        "item-review-review"?: Review["pk"];
      },
  signal?: AbortSignal,
) {
  const response = await request(
    "GET",
    "/review-items/",
    params,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<ReviewItem[]> = response.json();
  return promise;
}
