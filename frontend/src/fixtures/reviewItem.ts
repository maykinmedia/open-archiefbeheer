import { Review, ReviewItem } from "../lib/api/review";
import { FIXTURE_ZAAK, FIXTURE_ZAKEN } from "./zaak";

export const FIXTURE_REVIEW_ITEM: ReviewItem = {
  pk: 1,
  zaak: FIXTURE_ZAAK,
  feedback: "Deze niet",
};

export const FIXTURE_REVIEW_ITEMS: ReviewItem[] = [
  FIXTURE_REVIEW_ITEM,
  {
    pk: 2,
    zaak: FIXTURE_ZAKEN[1],
    feedback: "Deze ook niet",
  },
  {
    pk: 3,
    zaak: FIXTURE_ZAKEN[2],
    feedback: "Deze nog niet",
  },
];
