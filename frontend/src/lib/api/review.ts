import { Zaak } from "../../types";
import { User } from "./auth";
import { DestructionList } from "./destructionLists";
import { request } from "./request";

export type Review = {
  destructionList: string;
  decision: "accepted" | "rejected";
  listFeedback: string;
  pk?: number;
  author?: User;
  created?: string;
  zakenReviews?: ZaakReview[];
};

export type ZaakReview = {
  zaakUrl: Zaak["url"];
  feedback: string;
};

export type ReviewItem = {
  pk: number;
  zaak: Zaak;
  feedback: string;
};

/**
 * Create a new destruction list review
 */
export async function createDestructionListReview({ ...data }: Review) {
  const response = await request(
    "POST",
    "/destruction-list-reviews/",
    undefined,
    {
      ...data,
    },
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
) {
  const reviews = await listReviews({ ...params, ordering: "-created" });
  return reviews[0];
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
) {
  const response = await request("GET", "/destruction-list-reviews/", params);
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
        review?: Review["pk"];
      },
) {
  const response = await request("GET", "/review-items/", params);
  const promise: Promise<ReviewItem[]> = response.json();
  return promise;
}
