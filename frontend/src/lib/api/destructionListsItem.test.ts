import { destructionListItemsFactory } from "../../fixtures/destructionListItem";
import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import { listDestructionListItems } from "./destructionListsItem";

describe("listDestructionListItems", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a list of users on success", async () => {
    const destructionListItems = destructionListItemsFactory();
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-list-items/",
      destructionListItems,
    );
    await expect(
      listDestructionListItems("00000000-0000-0000-0000-000000000000"),
    ).resolves.toEqual(destructionListItems);
  });

  it("should type item-order_review_ignored", async () => {
    const destructionListItems = destructionListItemsFactory();
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-list-items/",
      destructionListItems,
    );
    listDestructionListItems("00000000-0000-0000-0000-000000000000", {
      "item-order_review_ignored": true,
    });
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-list-items/",
    );
    await expect(
      listDestructionListItems("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow();
  });
});
