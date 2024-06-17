import { request } from "./request";

export interface CreateDestructionListReviewData {
  destructionList: string; // uuid
  decision: "accepted" | "rejected";
  listFeedback: string;
  zakenReviews: {
    zaak_url: string;
    feedback: string;
  }[];
}

/**
 * Create a new destruction list review
 */
export async function createDestructionListReview({
  ...data
}: CreateDestructionListReviewData) {
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
