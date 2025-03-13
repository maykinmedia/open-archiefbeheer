import { User } from "./auth";
import { DestructionList } from "./destructionLists";
import { request } from "./request";

export type CoReviewBase = {
  destructionList: string;
  listFeedback: string;
};

export type CoReview = CoReviewBase & {
  pk: number;
  author: User;
  created: string;
};

/**
 * Create a new co-review.
 */
export async function createCoReview(data: CoReviewBase, signal?: AbortSignal) {
  const response = await request(
    "POST",
    "/destruction-list-co-reviews/",
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
 * List all the co-reviews that have been made for a destruction list.
 */
export async function listCoReviews(
  params?:
    | URLSearchParams
    | {
        destructionList__uuid?: DestructionList["uuid"];
        ordering?: "-created" | "created";
      },
  signal?: AbortSignal,
) {
  const response = await request(
    "GET",
    "/destruction-list-co-reviews/",
    params,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<CoReview[]> = response.json();
  return promise;
}
