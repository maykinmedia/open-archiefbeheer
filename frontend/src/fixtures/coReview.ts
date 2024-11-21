import { CoReview } from "../lib/api/coReview";
import { destructionListFactory } from "./destructionList";
import { createArrayFactory, createObjectFactory } from "./factory";
import { beoordelaarFactory } from "./user";

const FIXTURE_CO_REVIEW: CoReview = {
  pk: 1,
  destructionList: destructionListFactory().uuid,
  author: beoordelaarFactory(),
  listFeedback: "",
  created: "2023-09-15T21:36:00.000000+01:00",
};

const coReviewFactory = createObjectFactory(FIXTURE_CO_REVIEW);
const coReviewsFactory = createArrayFactory([FIXTURE_CO_REVIEW]);

export { coReviewFactory, coReviewsFactory };
