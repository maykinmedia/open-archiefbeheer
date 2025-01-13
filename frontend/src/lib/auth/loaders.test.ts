import { redirect } from "react-router-dom";

import { userFactory } from "../../fixtures/user";
import { whoAmI } from "../api/auth";
import { formatUser } from "../format/user";
import {
  canReviewDestructionListRequired,
  canStartDestructionListRequired,
  canTriggerDestructionRequired,
  canUpdateDestructionListRequired,
  canViewAndEditSettingsRequired,
  canViewDestructionListRequired,
  loginRequired,
} from "./loaders";
import {
  canChangeSettings,
  canReviewDestructionList,
  canStartDestructionList,
  canTriggerDestruction,
  canUpdateDestructionList,
  canViewDestructionList,
} from "./permissions";

jest.mock("../api/auth", () => ({
  whoAmI: jest.fn(),
}));

jest.mock("./permissions", () => ({
  canStartDestructionList: jest.fn(),
  canReviewDestructionList: jest.fn(),
  canCoReviewDestructionList: jest.fn(),
  canUpdateDestructionList: jest.fn(),
  canViewDestructionList: jest.fn(),
  canTriggerDestruction: jest.fn(),
  canChangeSettings: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  redirect: jest.fn(),
}));

describe("loginRequired", () => {
  it("add a 403 handler to loader wrapped in `loginRequired`", async () => {
    const loader = () => {
      throw { status: 403 };
    };

    loginRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });
    expect(redirect).toHaveBeenCalledWith("/login?next=/");
  });

  it("should add the `next` query parameter", async () => {
    const loader = () => {
      throw { status: 403 };
    };

    loginRequired(loader)({
      request: {
        url: "http://zaken.nl/destruction-lists/",
      } as unknown as Request,
      params: {},
    });
    expect(redirect).toHaveBeenCalledWith("/login?next=/destruction-lists/");
  });

  it("should remove the `next` query parameter if set to prevent loops", async () => {
    const loader = () => {
      throw { status: 403 };
    };

    loginRequired(loader)({
      request: {
        url: "http://zaken.nl/?next=destruction-lists/",
      } as unknown as Request,
      params: {},
    });
    expect(redirect).toHaveBeenCalledWith("/login?next=/");
  });
});

describe("canStartDestructionListRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = jest.fn();
    jest.mocked(canStartDestructionList).mockReturnValueOnce(true);

    await canStartDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = jest.fn();
    const user = userFactory();
    jest.mocked(whoAmI).mockResolvedValueOnce(user);
    jest.mocked(canStartDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canStartDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toEqual(
      new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om vernietigingslijsten aan te maken.`,
      }),
    );

    expect(loader).not.toHaveBeenCalled();
  });
});

describe("canReviewDestructionListRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    jest.mocked(canReviewDestructionList).mockReturnValueOnce(true);

    await canReviewDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    jest.mocked(whoAmI).mockResolvedValueOnce(user);
    jest.mocked(canReviewDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canReviewDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toEqual(
      new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te beoordelen.`,
      }),
    );
  });
});

describe("canUpdateDestructionListRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    jest.mocked(canUpdateDestructionList).mockReturnValueOnce(true);

    await canUpdateDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    jest.mocked(whoAmI).mockResolvedValueOnce(user);
    jest.mocked(canUpdateDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canUpdateDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toEqual(
      new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te bewerken.`,
      }),
    );
  });
});

describe("canViewDestructionListRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    jest.mocked(canViewDestructionList).mockReturnValueOnce(true);

    await canViewDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    jest.mocked(whoAmI).mockResolvedValueOnce(user);
    jest.mocked(canViewDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canViewDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toEqual(
      new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te bekijken.`,
      }),
    );
  });
});

describe("canTriggerDestructionRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    jest.mocked(canTriggerDestruction).mockReturnValueOnce(true);

    await canTriggerDestructionRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    jest.mocked(whoAmI).mockResolvedValueOnce(user);
    jest.mocked(canTriggerDestruction).mockReturnValueOnce(false);

    const wrappedLoader = canTriggerDestructionRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toEqual(
      new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te vernietigen.`,
      }),
    );
  });
});

describe("canViewAndEditSettingsRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    jest.mocked(canChangeSettings).mockReturnValueOnce(true);

    await canViewAndEditSettingsRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = jest.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    jest.mocked(whoAmI).mockResolvedValueOnce(user);
    jest.mocked(canChangeSettings).mockReturnValueOnce(false);

    const wrappedLoader = canViewAndEditSettingsRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toEqual(
      new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om de instellingen te wijzigen.`,
      }),
    );
  });
});
