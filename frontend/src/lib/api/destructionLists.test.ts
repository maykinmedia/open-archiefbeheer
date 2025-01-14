import fetchMock from "jest-fetch-mock";

import {
  destructionListAssigneesFactory,
  destructionListFactory,
} from "../../fixtures/destructionList";
import { zaakFactory, zakenFactory } from "../../fixtures/zaak";
import {
  abort,
  createDestructionList,
  deleteDestructionList,
  destructionListQueueDestruction,
  getDestructionList,
  listDestructionListCoReviewers,
  listDestructionLists,
  markDestructionListAsFinal,
  markDestructionListAsReadyToReview,
  reassignDestructionList,
  updateCoReviewers,
  updateDestructionList,
} from "./destructionLists";

describe("createDestructionList", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a data on success", async () => {
    const fixture = {
      add: [
        {
          pk: 0,
          status: "suggested",
          zaak: "http://example.com",
          processingStatus: "new",
        },
      ],
      remove: [
        {
          pk: 0,
          status: "suggested",
          zaak: "http://example.com",
          processingStatus: "new",
        },
      ],
      uuid: "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
      name: "string",
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
      comment: "string",
      containsSensitiveInfo: true,
      reviewer: {
        user: 0,
      },
      status: "new",
      selectAll: true,
      zaakFilters: null,
    };
    fetchMock.mockResponseOnce(JSON.stringify(fixture));
    await expect(
      createDestructionList(
        "My first destruction list",
        zakenFactory(),
        "2",
        "{}",
        false,
        "",
      ),
    ).resolves.toEqual(fixture);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      createDestructionList(
        "My first destruction list",
        zakenFactory(),
        "2",
        "{}",
        false,
        "",
      ),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("getDestructionList", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a destruction list on success", async () => {
    const destructionList = destructionListFactory();
    fetchMock.mockResponseOnce(JSON.stringify(destructionList));
    await expect(
      getDestructionList("00000000-0000-0000-0000-000000000000"),
    ).resolves.toEqual(destructionList);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      getDestructionList("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("listDestructionLists", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return destruction lists on success", async () => {
    const destructionLists = [destructionListFactory()];
    fetchMock.mockResponseOnce(JSON.stringify(destructionLists));
    await expect(listDestructionLists()).resolves.toEqual(destructionLists);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(listDestructionLists()).rejects.toThrow(
      "Internal Server Error",
    );
  });
});

describe("deleteDestructionList", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return null on success", async () => {
    fetchMock.mockResponse(async () => ({
      status: 204,
    }));
    await expect(
      deleteDestructionList("00000000-0000-0000-0000-000000000000"),
    ).resolves.toBeNull();
  });

  it("should return details on graceful failure", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "Something Went Wrong",
      }),
    );
    await expect(
      deleteDestructionList("00000000-0000-0000-0000-000000000000"),
    ).resolves.toEqual({
      error: "Something Went Wrong",
    });
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      deleteDestructionList("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("updateDestructionList", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return data on success", async () => {
    const fixture = {
      add: [
        {
          pk: 0,
          status: "suggested",
          zaak: "http://example.com",
          processingStatus: "new",
        },
      ],
      remove: [
        {
          pk: 0,
          status: "suggested",
          zaak: "http://example.com",
          processingStatus: "new",
        },
      ],
      uuid: "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
      name: "string",
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
      comment: "string",
      containsSensitiveInfo: true,
      reviewer: {
        user: 0,
      },
      status: "new",
      selectAll: true,
      zaakFilters: null,
    };
    fetchMock.mockResponseOnce(JSON.stringify(fixture));
    await expect(
      updateDestructionList("00000000-0000-0000-0000-000000000000", {
        assignees: [{ user: 2 }],
        add: [{ status: "", zaak: zaakFactory().url }],
        remove: [],
        comment: "",
      }),
    ).resolves.toEqual(fixture);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      updateDestructionList("00000000-0000-0000-0000-000000000000", {
        assignees: [{ user: 2 }],
        add: [{ status: "", zaak: zaakFactory().url }],
        remove: [],
        comment: "",
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("markDestructionListAsReadyToReview", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return null on success", async () => {
    fetchMock.mockResponse(async () => ({
      status: 201,
    }));
    await expect(
      markDestructionListAsReadyToReview(
        "00000000-0000-0000-0000-000000000000",
      ),
    ).resolves.toBeNull();
  });

  it("should return details on graceful failure", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "Something Went Wrong",
      }),
    );
    await expect(
      markDestructionListAsReadyToReview(
        "00000000-0000-0000-0000-000000000000",
      ),
    ).resolves.toEqual({
      error: "Something Went Wrong",
    });
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      markDestructionListAsReadyToReview(
        "00000000-0000-0000-0000-000000000000",
      ),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("markDestructionListAsFinal", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return null on success", async () => {
    fetchMock.mockResponse(async () => ({
      status: 201,
    }));
    await expect(
      markDestructionListAsFinal("00000000-0000-0000-0000-000000000000", {
        user: 3,
        comment: "",
      }),
    ).resolves.toBeNull();
  });

  it("should return details on graceful failure", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "Something Went Wrong",
      }),
    );
    await expect(
      markDestructionListAsFinal("00000000-0000-0000-0000-000000000000", {
        user: 3,
        comment: "",
      }),
    ).resolves.toEqual({
      error: "Something Went Wrong",
    });
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      markDestructionListAsFinal("00000000-0000-0000-0000-000000000000", {
        user: 3,
        comment: "",
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("destructionListQueueDestruction", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return null on success", async () => {
    fetchMock.mockResponseOnce("");
    await expect(
      destructionListQueueDestruction("00000000-0000-0000-0000-000000000000"),
    ).resolves.toBeNull();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      destructionListQueueDestruction("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("reassignDestructionList", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return response on success", async () => {
    await expect(
      reassignDestructionList("00000000-0000-0000-0000-000000000000", {
        assignee: { user: 2 },
        comment: "",
      }),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      reassignDestructionList("00000000-0000-0000-0000-000000000000", {
        assignee: { user: 2 },
        comment: "",
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("listDestructionListCoReviewers", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return co reviewers on success", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify(
        destructionListAssigneesFactory([{ role: "co_reviewer" }]),
      ),
    );
    await expect(
      listDestructionListCoReviewers("00000000-0000-0000-0000-000000000000"),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      listDestructionListCoReviewers("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("updateCoReviewers", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return response on success", async () => {
    await expect(
      updateCoReviewers("00000000-0000-0000-0000-000000000000", {
        add: [{ user: 4 }],
        comment: "",
      }),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      updateCoReviewers("00000000-0000-0000-0000-000000000000", {
        add: [{ user: 4 }],
        comment: "",
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("abort", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return response on success", async () => {
    await expect(
      abort("00000000-0000-0000-0000-000000000000", {
        comment: "",
      }),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      abort("00000000-0000-0000-0000-000000000000", {
        comment: "",
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});
