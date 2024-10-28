import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { Review } from "../lib/api/review";
import {
  ReviewResponse,
  getLatestReviewResponse,
} from "../lib/api/reviewResponse";

/**
 * Hook resolving latest review response
 */
export function useLatestReviewResponse(
  review?: Review,
): ReviewResponse | null {
  const alert = useAlert();

  const [reviewResponseState, setReviewResponseState] =
    useState<ReviewResponse | null>(null);
  useEffect(() => {
    if (!review) {
      setReviewResponseState(null);
      return;
    }
    getLatestReviewResponse({ review: review.pk })
      .then((r) => setReviewResponseState(r || null))
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van de verwerkte beoordeling!",
          "Ok",
        );
      });
  }, [review?.pk]);

  return reviewResponseState;
}
