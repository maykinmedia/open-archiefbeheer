import {
  destructionListAssigneesFactory,
  destructionListFactory,
} from "../../fixtures/destructionList";
import { zaakFactory, zakenFactory } from "../../fixtures/zaak";
import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
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
  updateAssigneeDestructionList,
  updateCoReviewers,
  updateDestructionList,
} from "./destructionLists";

describe("createDestructionList", () => {
  afterEach(() => {
    resetMocks();
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

    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/",
      fixture,
    );

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
    mockRejectOnce("post", "http://localhost:8000/api/v1/destruction-lists/");
    await expect(
      createDestructionList(
        "My first destruction list",
        zakenFactory(),
        "2",
        "{}",
        false,
        "",
      ),
    ).rejects.toThrow();
  });
});

describe("getDestructionList", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a destruction list on success", async () => {
    resetMocks();
    const destructionList = destructionListFactory();
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/",
      destructionList,
    );

    await expect(
      getDestructionList("00000000-0000-0000-0000-000000000000"),
    ).resolves.toEqual(destructionList);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/",
    );

    await expect(
      getDestructionList("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow();
  });
});

describe("listDestructionLists", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return destruction lists on success", async () => {
    const destructionLists = [destructionListFactory()];
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-lists/",
      destructionLists,
    );

    await expect(listDestructionLists()).resolves.toEqual(destructionLists);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/destruction-lists/");
    await expect(listDestructionLists()).rejects.toThrow();
  });
});

describe("deleteDestructionList", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return null on success", async () => {
    mockResponseOnce(
      "delete",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000",
      null,
    );

    await expect(
      deleteDestructionList("00000000-0000-0000-0000-000000000000"),
    ).resolves.toBeNull();
  });

  it("should return details on graceful failure", async () => {
    mockResponseOnce(
      "delete",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000",
      {
        error: "Something Went Wrong",
      },
    );

    await expect(
      deleteDestructionList("00000000-0000-0000-0000-000000000000"),
    ).resolves.toEqual({
      error: "Something Went Wrong",
    });
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "delete",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000",
    );

    await expect(
      deleteDestructionList("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow();
  });
});

describe("updateDestructionList", () => {
  afterEach(() => {
    resetMocks();
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

    mockResponseOnce(
      "patch",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/",
      fixture,
    );

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
    mockRejectOnce(
      "patch",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/",
    );

    await expect(
      updateDestructionList("00000000-0000-0000-0000-000000000000", {
        assignees: [{ user: 2 }],
        add: [{ status: "", zaak: zaakFactory().url }],
        remove: [],
        comment: "",
      }),
    ).rejects.toThrow();
  });
});

describe("markDestructionListAsReadyToReview", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return null on success", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/mark_ready_review/",
      null,
    );

    await expect(
      markDestructionListAsReadyToReview(
        "00000000-0000-0000-0000-000000000000",
      ),
    ).resolves.toBeNull();
  });

  it("should return details on graceful failure", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/mark_ready_review/",
      {
        error: "Something Went Wrong",
      },
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
    mockRejectOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/mark_ready_review/",
    );
    await expect(
      markDestructionListAsReadyToReview(
        "00000000-0000-0000-0000-000000000000",
      ),
    ).rejects.toThrow();
  });
});

describe("markDestructionListAsFinal", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return null on success", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/make_final/",
      null,
    );

    await expect(
      markDestructionListAsFinal("00000000-0000-0000-0000-000000000000", {
        user: 3,
        comment: "",
      }),
    ).resolves.toBeNull();
  });

  it("should return details on graceful failure", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/make_final/",
      {
        error: "Something Went Wrong",
      },
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
    mockRejectOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/make_final/",
    );

    await expect(
      markDestructionListAsFinal("00000000-0000-0000-0000-000000000000", {
        user: 3,
        comment: "",
      }),
    ).rejects.toThrow();
  });
});

describe("destructionListQueueDestruction", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return null on success", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/queue_destruction/",
      null,
    );

    await expect(
      destructionListQueueDestruction("00000000-0000-0000-0000-000000000000"),
    ).resolves.toBeNull();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/queue_destruction/",
    );

    await expect(
      destructionListQueueDestruction("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow();
  });
});

describe("reassignDestructionList", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return response on success", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/update_assignee/",
      {},
    );

    await expect(
      updateAssigneeDestructionList("00000000-0000-0000-0000-000000000000", {
        assignee: { user: 2, role: "main_reviewer" },
        comment: "",
      }),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/update_assignee/",
    );

    await expect(
      updateAssigneeDestructionList("00000000-0000-0000-0000-000000000000", {
        assignee: { user: 2, role: "main_reviewer" },
        comment: "",
      }),
    ).rejects.toThrow();
  });
});

describe("listDestructionListCoReviewers", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return co reviewers on success", async () => {
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
      destructionListAssigneesFactory([{ role: "co_reviewer" }]),
    );

    await expect(
      listDestructionListCoReviewers("00000000-0000-0000-0000-000000000000"),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "get",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
    );

    await expect(
      listDestructionListCoReviewers("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow();
  });
});

describe("updateCoReviewers", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return response on success", async () => {
    mockResponseOnce(
      "put",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
      {},
    );

    await expect(
      updateCoReviewers("00000000-0000-0000-0000-000000000000", {
        add: [{ user: 4 }],
        comment: "",
      }),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "put",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
    );

    await expect(
      updateCoReviewers("00000000-0000-0000-0000-000000000000", {
        add: [{ user: 4 }],
        comment: "",
      }),
    ).rejects.toThrow();
  });
});

describe("abort", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return response on success", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/abort/",
      {},
    );

    await expect(
      abort("00000000-0000-0000-0000-000000000000", {
        comment: "",
      }),
    ).resolves.toBeTruthy();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "post",
      "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/abort/",
    );

    await expect(
      abort("00000000-0000-0000-0000-000000000000", {
        comment: "",
      }),
    ).rejects.toThrow();
  });
});
