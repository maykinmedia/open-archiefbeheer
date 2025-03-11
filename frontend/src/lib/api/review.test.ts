import { reviewFactory, reviewItemsFactory } from "../../fixtures";
import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import {
  createDestructionListReview,
  getLatestReview,
  listReviewItems,
} from "./review";

describe("createDestructionListReview", () => {
  afterEach(() => {
    resetMocks();
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
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-list-reviews",
      fixture,
    );
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
    mockRejectOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-list-reviews/",
    );
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
    ).rejects.toThrow();
  });
});

describe("getLatestReview", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a list of users on success", async () => {
    const review = [reviewFactory()];
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-list-reviews/",
      review,
    );
    await expect(getLatestReview()).resolves.toEqual(review[0]);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-list-reviews/",
    );
    await expect(getLatestReview()).rejects.toThrow();
  });
});

describe("listReviewItems", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a list of users on success", async () => {
    const reviewItems = reviewItemsFactory();
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/review-items/",
      reviewItems,
    );
    await expect(
      listReviewItems({
        "item-review-review": 0,
      }),
    ).resolves.toEqual(reviewItems);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/review-items/");
    await expect(
      listReviewItems({
        "item-review-review": 0,
      }),
    ).rejects.toThrow();
  });
});
