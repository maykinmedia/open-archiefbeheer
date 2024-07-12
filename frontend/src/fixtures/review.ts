import { Review } from "../lib/api/review";
import { destructionListFactory } from "./destructionList";
import { createObjectFactory } from "./factory";
import { beoordelaarFactory } from "./user";

const FIXTURE_REVIEW: Review = {
  pk: 1,
  destructionList: destructionListFactory().uuid,
  author: beoordelaarFactory(),
  decision: "rejected",
  listFeedback: "",
  created: "2024-06-24T17:08:10.474973+02:00",
};

const reviewFactory = createObjectFactory<Review>(FIXTURE_REVIEW);

export { reviewFactory };
