import fetchMock from "jest-fetch-mock";

import { reviewFactory } from "../../fixtures/review";
import { reviewItemsFactory } from "../../fixtures/reviewItem";
import {
  createDestructionListReview,
  getLatestReview,
  listReviewItems,
} from "./review";

describe("createDestructionListReview", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return data on success", async () => {
    const fixture = {
      pk: 0,
      destructionList: "00000000-0000-0000-0000-000000000000",
      author: {
        pk: 0,
        username: "^w$",
        firstName: "string",
        lastName: "string",
        email: "user@example.com",
        role: {
          canStartDestruction: false,
          canReviewDestruction: false,
          canCoReviewDestruction: false,
          canReviewFinalList: false,
        },
      },
      decision: "accepted",
      listFeedback: "string",
      zakenReviews: [
        {
          zaakUrl: "http://example.com",
          feedback: "string",
        },
      ],
      created: "2019-08-24T14:15:22Z",
    };
    fetchMock.mockResponseOnce(JSON.stringify(fixture));
    await expect(
      createDestructionListReview({
        destructionList: "00000000-0000-0000-0000-000000000000",
        decision: "accepted",
        listFeedback: "",
        zakenReviews: [
          {
            zaakUrl: "http://example.com",
            feedback: "string",
          },
        ],
      }),
    ).resolves.toEqual(fixture);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      createDestructionListReview({
        destructionList: "00000000-0000-0000-0000-000000000000",
        decision: "accepted",
        listFeedback: "",
        zakenReviews: [
          {
            zaakUrl: "http://example.com",
            feedback: "string",
          },
        ],
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("getLatestReview", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a list of users on success", async () => {
    const review = [reviewFactory()];
    fetchMock.mockResponseOnce(JSON.stringify(review));
    await expect(getLatestReview()).resolves.toEqual(review[0]);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(getLatestReview()).rejects.toThrow("Internal Server Error");
  });
});

describe("listReviewItems", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a list of users on success", async () => {
    const reviewItems = reviewItemsFactory();
    fetchMock.mockResponseOnce(JSON.stringify(reviewItems));
    await expect(
      listReviewItems({
        "item-review-review": 0,
      }),
    ).resolves.toEqual(reviewItems);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      listReviewItems({
        "item-review-review": 0,
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});
