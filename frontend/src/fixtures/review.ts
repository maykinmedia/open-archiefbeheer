import { Review } from "../lib/api/review";
import { FIXTURE_DESTRUCTION_LIST } from "./destructionList";
import { FIXTURE_BEOORDELAAR } from "./user";

export const FIXTURE_REVIEW: Review = {
  pk: 1,
  destructionList: FIXTURE_DESTRUCTION_LIST.uuid,
  author: FIXTURE_BEOORDELAAR,
  decision: "rejected",
  listFeedback: "",
  created: "2024-06-24T17:08:10.474973+02:00",
};
