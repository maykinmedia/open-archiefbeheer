import { expect } from "@storybook/test";
import fetchMock from "jest-fetch-mock";

import { coReviewFactory } from "../../fixtures/coReview";
import { destructionListFactory } from "../../fixtures/destructionList";
import { createCoReview, listCoReviews } from "./coReview";

describe("coReview", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test("listCoReviews() GETs co-reviews ", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([coReviewFactory({ listFeedback: "gh-497" })]),
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
    fetchMock.mockResponseOnce(JSON.stringify(fixture));
    await createCoReview(fixture);

    const requestInit = fetchMock.mock.calls[0][1];
    const data = JSON.parse(requestInit?.body as string);
    expect(data.destructionList).toBe(uuid);
    expect(data.listFeedback).toBe("gh-497");
  });
});
