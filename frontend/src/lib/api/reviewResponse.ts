import { request } from "./request";
import { Review, ReviewItem } from "./review";

export type ReviewResponse = {
  review: number;
  comment: string;
  itemsResponses: ReviewItemResponse[];
  pk?: number;
  created?: string;
};

export type ReviewItemResponse = {
  reviewItem: ReviewItem["pk"];
  actionItem: "keep" | "remove";
  actionZaakType?: "selectielijstklasse_and_bewaartermijn" | "bewaartermijn";
  actionZaak?: ActionZaak;
  comment: string;
  pk?: number;
  created?: string;
};

export type ActionZaak = {
  selectielijstklasse?: string;
  archiefactiedatum?: string;
};

/**
 * Create a response to a review. You need to be the author of a destruction list for this and you need to be assigned
 * to it. The status of the destruction list must be 'changes requested'.
 */
export async function createReviewResponse(
  data: ReviewResponse,
  params?:
    | URLSearchParams
    | {
        review?: Review["pk"];
      },
) {
  const response = await request("POST", "/review-responses/", params, data);
  const promise: Promise<ReviewResponse> = response.json();
  return promise;
}

/**
 * Get the latest review for a destruction list.
 */
export async function getLatestReviewResponse(
  params?:
    | URLSearchParams
    | {
        review?: Review["pk"];
      },
): Promise<ReviewResponse | undefined> {
  const reviews = await listReviewResponses({
    ...params,
  });
  return reviews[0];
}

/**
 * List all the responses to the reviews of a destruction list.
 */
export async function listReviewResponses(
  params?:
    | URLSearchParams
    | {
        review?: Review["pk"];
      },
) {
  const response = await request("GET", "/review-responses/", params);
  const promise: Promise<ReviewResponse[]> = response.json();
  return promise;
}
