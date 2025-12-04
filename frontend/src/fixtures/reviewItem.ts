import { ReviewItemWithZaak } from "../lib/api/review";
import { createArrayFactory, createObjectFactory } from "./factory";
import { zaakFactory, zakenFactory } from "./zaak";

const FIXTURE_REVIEW_ITEM: ReviewItemWithZaak = {
  pk: 1,
  destructionListItem: 2,
  zaak: zaakFactory(),
  feedback: "Deze niet",
};

const FIXTURE_REVIEW_ITEMS: ReviewItemWithZaak[] = [
  FIXTURE_REVIEW_ITEM,
  {
    pk: 2,
    destructionListItem: 2,
    zaak: zakenFactory()[1],
    feedback: "Deze ook niet",
  },
  {
    pk: 3,
    destructionListItem: 2,
    zaak: zakenFactory()[2],
    feedback: "Deze nog niet",
  },
];

const reviewItemFactory =
  createObjectFactory<ReviewItemWithZaak>(FIXTURE_REVIEW_ITEM);
const reviewItemsFactory =
  createArrayFactory<ReviewItemWithZaak>(FIXTURE_REVIEW_ITEMS);

export { reviewItemFactory, reviewItemsFactory };
