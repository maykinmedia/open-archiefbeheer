import { useEffect, useState } from "react";

import { Review } from "../lib/api/review";
import {
  ReviewResponse,
  getLatestReviewResponse,
} from "../lib/api/reviewResponse";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving latest review response
 */
export function useLatestReviewResponse(
  review?: Review,
): ReviewResponse | null {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de verwerkte beoordeling!",
  );

  const [reviewResponseState, setReviewResponseState] =
    useState<ReviewResponse | null>(null);
  useEffect(() => {
    if (!review) {
      setReviewResponseState(null);
      return;
    }
    getLatestReviewResponse({ review: review.pk })
      .then((r) => setReviewResponseState(r || null))
      .catch(alertOnError);
  }, [review?.pk]);

  return reviewResponseState;
}
