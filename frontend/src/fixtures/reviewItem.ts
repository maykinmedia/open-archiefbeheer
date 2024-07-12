import { ReviewItem } from "../lib/api/review";
import { createArrayFactory, createObjectFactory } from "./factory";
import { zaakFactory, zakenFactory } from "./zaak";

const FIXTURE_REVIEW_ITEM: ReviewItem = {
  pk: 1,
  zaak: zaakFactory(),
  feedback: "Deze niet",
};

const FIXTURE_REVIEW_ITEMS: ReviewItem[] = [
  FIXTURE_REVIEW_ITEM,
  {
    pk: 2,
    zaak: zakenFactory()[1],
    feedback: "Deze ook niet",
  },
  {
    pk: 3,
    zaak: zakenFactory()[2],
    feedback: "Deze nog niet",
  },
];

const reviewItemFactory = createObjectFactory<ReviewItem>(FIXTURE_REVIEW_ITEM);
const reviewItemsFactory = createArrayFactory<ReviewItem>(FIXTURE_REVIEW_ITEMS);

export { reviewItemFactory, reviewItemsFactory };
