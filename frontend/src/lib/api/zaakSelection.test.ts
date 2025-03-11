import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../test/mockResponse";
import { ZaakSelection } from "../zaakSelection";
import {
  SelectionSizeResponse,
  deleteSelection,
  getAllSelected,
  getSelection,
  getSelectionItems,
  getSelectionSize,
  setAllSelected,
  updateSelection,
} from "./zaakSelection";

describe("getSelection", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a zaak selection on success", async () => {
    const zaakSelection: ZaakSelection = {
      "http://zaken.nl": {
        selected: true,
        detail: {},
      },
    };
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/selections/key/",
      zaakSelection,
    );
    await expect(getSelection("key")).resolves.toEqual(zaakSelection);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/selections/key/");
    await expect(getSelection("key")).rejects.toThrow();
  });

  it("should handle request abort signal", async () => {
    const abortController = new AbortController();
    let rejected = false;
    getSelection("key", {}, true, abortController.signal).catch((error) => {
      rejected = true;
      expect(error.message).toContain("abort");
    });
    abortController.abort();
    await vi.waitUntil(() => rejected === true);
  });
});

describe("getSelectionItems", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a zaak selection on success", async () => {
    const zaakSelection: ZaakSelection = {
      "http://zaken.nl": {
        selected: true,
        detail: {},
      },
    };
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/selections/key/",
      zaakSelection,
    );
    await expect(
      getSelectionItems("key", ["http://zaken.nl"]),
    ).resolves.toEqual(zaakSelection);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("post", "http://localhost:8000/api/v1/selections/key/");
    await expect(
      getSelectionItems("key", ["http://zaken.nl"]),
    ).rejects.toThrow();
  });
});

describe("updateSelection", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a zaak selection on success", async () => {
    const zaakSelection: ZaakSelection = {
      "http://zaken.nl": {
        selected: true,
        detail: {},
      },
    };
    mockResponseOnce(
      "patch",
      "http://localhost:8000/api/v1/selections/key/",
      zaakSelection,
    );
    await expect(updateSelection("key", zaakSelection)).resolves.toEqual(
      zaakSelection,
    );
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("patch", "http://localhost:8000/api/v1/selections/key/");
    await expect(
      updateSelection("key", {
        "http://zaken.nl": {
          selected: true,
          detail: {},
        },
      }),
    ).rejects.toThrow();
  });
});

describe("deleteSelection", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a undefined on success", async () => {
    mockResponseOnce(
      "delete",
      "http://localhost:8000/api/v1/selections/key/",
      null,
    );
    await expect(deleteSelection("key")).resolves.toBeUndefined();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("delete", "http://localhost:8000/api/v1/selections/key/");
    await expect(deleteSelection("key")).rejects.toThrow();
  });
});

describe("getSelectionSize", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return a selection size on success", async () => {
    const count: SelectionSizeResponse = { count: 1 };
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/selections/key/count/",
      count,
    );
    await expect(getSelectionSize("key")).resolves.toEqual(count);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce("get", "http://localhost:8000/api/v1/selections/key/count/");
    await expect(getSelectionSize("key")).rejects.toThrow();
  });
});

describe("getAllSelected", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return all selected on success", async () => {
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/selections/key/select-all/",
      { allSelected: false },
    );
    await expect(getAllSelected("key")).resolves.toEqual(false);
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "get",
      "http://localhost:8000/api/v1/selections/key/select-all/",
    );
    await expect(getAllSelected("key")).rejects.toThrow();
  });
});

describe("setAllSelected", () => {
  afterEach(() => {
    resetMocks();
  });

  it("should return undefined on success", async () => {
    mockResponseOnce(
      "post",
      "http://localhost:8000/api/v1/selections/key/select-all/",
    );
    await expect(setAllSelected("key", true)).resolves.toBeUndefined();
  });

  it("should throw an error on failure", async () => {
    mockRejectOnce(
      "post",
      "http://localhost:8000/api/v1/selections/key/select-all/",
    );
    await expect(setAllSelected("key", true)).rejects.toThrow();
  });
});
