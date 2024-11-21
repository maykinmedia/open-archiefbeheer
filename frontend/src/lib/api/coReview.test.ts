import { expect } from "@storybook/test";

import { coReviewFactory } from "../../fixtures/coReview";
import { destructionListFactory } from "../../fixtures/destructionList";
import {
  addFetchMock,
  getLastMockedRequest,
  restoreNativeFetch,
} from "../test";
import { createCoReview, listCoReviews } from "./coReview";

describe("coReview", () => {
  afterEach(restoreNativeFetch);

  test("listCoReviews() GETs co-reviews ", async () => {
    addFetchMock(
      "http://localhost:8000/api/v1/destruction-list-co-reviews/?",
      "GET",
      [coReviewFactory({ listFeedback: "gh-497" })],
    );
    const coReviews = await listCoReviews();
    expect(coReviews.length).toBe(1);
    expect(coReviews[0].listFeedback).toBe("gh-497");
  });

  test("createCoReview() POSTs co-review ", async () => {
    addFetchMock(
      "http://localhost:8000/api/v1/destruction-list-co-reviews/?",
      "POST",
      {},
    );

    const uuid = destructionListFactory().uuid;
    await createCoReview({
      destructionList: uuid,
      listFeedback: "gh-497",
    });

    const requestInit = getLastMockedRequest(
      "http://localhost:8000/api/v1/destruction-list-co-reviews/?",
      "POST",
    );

    const data = JSON.parse(requestInit?.body as string);
    expect(data.destructionList).toBe(uuid);
    expect(data.listFeedback).toBe("gh-497");
  });
});
