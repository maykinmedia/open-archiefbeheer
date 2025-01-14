import fetchMock from "jest-fetch-mock";

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
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a zaak selection on success", async () => {
    const zaakSelection: ZaakSelection = {
      "http://zaken.nl": {
        selected: true,
        detail: {},
      },
    };
    fetchMock.mockResponseOnce(JSON.stringify(zaakSelection));
    await expect(getSelection("key")).resolves.toEqual(zaakSelection);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(getSelection("key")).rejects.toThrow("Internal Server Error");
  });

  it("should handle request abort signal", async () => {
    const abortController = new AbortController();
    const zaakSelection: ZaakSelection = {
      "http://zaken.nl": {
        selected: true,
        detail: {},
      },
    };
    fetchMock.mockResponseOnce(JSON.stringify(zaakSelection));
    getSelection("key", {}, true, abortController.signal);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(abortController.signal);
  });
});

describe("getSelectionItems", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a zaak selection on success", async () => {
    const zaakSelection: ZaakSelection = {
      "http://zaken.nl": {
        selected: true,
        detail: {},
      },
    };
    fetchMock.mockResponseOnce(JSON.stringify(zaakSelection));
    await expect(
      getSelectionItems("key", ["http://zaken.nl"]),
    ).resolves.toEqual(zaakSelection);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(getSelectionItems("key", ["http://zaken.nl"])).rejects.toThrow(
      "Internal Server Error",
    );
  });
});

describe("updateSelection", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a zaak selection on success", async () => {
    const zaakSelection: ZaakSelection = {
      "http://zaken.nl": {
        selected: true,
        detail: {},
      },
    };
    fetchMock.mockResponseOnce(JSON.stringify(zaakSelection));
    await expect(updateSelection("key", zaakSelection)).resolves.toEqual(
      zaakSelection,
    );
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(
      updateSelection("key", {
        "http://zaken.nl": {
          selected: true,
          detail: {},
        },
      }),
    ).rejects.toThrow("Internal Server Error");
  });
});

describe("deleteSelection", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a undefined on success", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        "http://zaken.nl": {
          selected: true,
          detail: {},
        },
      }),
    );
    await expect(deleteSelection("key")).resolves.toBeUndefined();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(deleteSelection("key")).rejects.toThrow(
      "Internal Server Error",
    );
  });
});

describe("getSelectionSize", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return a selection size on success", async () => {
    const count: SelectionSizeResponse = { count: 1 };
    fetchMock.mockResponseOnce(JSON.stringify(count));
    await expect(getSelectionSize("key")).resolves.toEqual(count);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(getSelectionSize("key")).rejects.toThrow(
      "Internal Server Error",
    );
  });
});

describe("getAllSelected", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return all selected on success", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ allSelected: false }));
    await expect(getAllSelected("key")).resolves.toEqual(false);
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(getAllSelected("key")).rejects.toThrow(
      "Internal Server Error",
    );
  });
});

describe("setAllSelected", () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return undefined on success", async () => {
    await expect(setAllSelected("key", true)).resolves.toBeUndefined();
  });

  it("should throw an error on failure", async () => {
    fetchMock.mockRejectOnce(new Error("Internal Server Error"));
    await expect(setAllSelected("key", true)).rejects.toThrow(
      "Internal Server Error",
    );
  });
});
