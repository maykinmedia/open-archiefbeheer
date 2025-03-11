import { coReviewFactory, destructionListFactory } from "../../fixtures";
import {
  getInterceptedRequest,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import { createCoReview, listCoReviews } from "./coReview";

describe("coReview", () => {
  afterEach(() => {
    resetMocks();
  });

  test("listCoReviews() GETs co-reviews ", async () => {
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-list-co-reviews/",
      [coReviewFactory({ listFeedback: "gh-497" })],
    );

    const coReviews = await listCoReviews();
    expect(coReviews.length).toBe(1);
    expect(coReviews[0].listFeedback).toBe("gh-497");
  });

  test("createCoReview() POSTs co-review ", async () => {
    const uuid = destructionListFactory().uuid;
    const fixture = {
      destructionList: uuid,
      listFeedback: "gh-497",
    };

    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-list-co-reviews/",
      {},
    );

    await createCoReview(fixture);
    const payload = await getInterceptedRequest()[0].json();
    expect(payload).toStrictEqual(fixture);
  });
});
