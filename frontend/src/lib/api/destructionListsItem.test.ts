import fetchMock from "jest-fetch-mock";

import { destructionListItemsFactory } from "../../fixtures/destructionListItem";
import { listDestructionListItems } from "./destructionListsItem";

describe("listDestructionListItems", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a list of users on success", async () => {
    const destructionListItems = destructionListItemsFactory();
    fetchMock.mockResponseOnce(JSON.stringify(destructionListItems));
    await expect(
      listDestructionListItems("00000000-0000-0000-0000-000000000000"),
    ).resolves.toEqual(destructionListItems);
  });

  it("should type item-order_review_ignored", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(destructionListItemsFactory()));
    listDestructionListItems("00000000-0000-0000-0000-000000000000", {
      "item-order_review_ignored": true,
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/destruction-list-items/?item-destruction_list=00000000-0000-0000-0000-000000000000&item-status=suggested&item-order_review_ignored=true",
    );
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      listDestructionListItems("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("Internal Server Error");
  });
});
