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

vi.mock("../api/auth", () => ({
  whoAmI: vi.fn(),
}));

vi.mock("./permissions", () => ({
  canStartDestructionList: vi.fn(),
  canReviewDestructionList: vi.fn(),
  canCoReviewDestructionList: vi.fn(),
  canUpdateDestructionList: vi.fn(),
  canViewDestructionList: vi.fn(),
  canTriggerDestruction: vi.fn(),
  canChangeSettings: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  redirect: vi.fn(),
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
    const loader = vi.fn();
    vi.mocked(canStartDestructionList).mockReturnValueOnce(true);

    await canStartDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = vi.fn();
    const user = userFactory();
    vi.mocked(whoAmI).mockResolvedValueOnce(user);
    vi.mocked(canStartDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canStartDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toSatisfy(
      (response: Response) =>
        response.statusText ===
        `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om vernietigingslijsten aan te maken.`,
    );
    expect(loader).not.toHaveBeenCalled();
  });
});

describe("canReviewDestructionListRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    vi.mocked(canReviewDestructionList).mockReturnValueOnce(true);

    await canReviewDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    vi.mocked(whoAmI).mockResolvedValueOnce(user);
    vi.mocked(canReviewDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canReviewDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toSatisfy(
      (response: Response) =>
        response.statusText ===
        `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te beoordelen.`,
    );
  });
});

describe("canUpdateDestructionListRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    vi.mocked(canUpdateDestructionList).mockReturnValueOnce(true);

    await canUpdateDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    vi.mocked(whoAmI).mockResolvedValueOnce(user);
    vi.mocked(canUpdateDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canUpdateDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toSatisfy(
      (response: Response) =>
        response.statusText ===
        `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te bewerken.`,
    );
  });
});

describe("canViewDestructionListRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    vi.mocked(canViewDestructionList).mockReturnValueOnce(true);

    await canViewDestructionListRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    vi.mocked(whoAmI).mockResolvedValueOnce(user);
    vi.mocked(canViewDestructionList).mockReturnValueOnce(false);

    const wrappedLoader = canViewDestructionListRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toSatisfy(
      (response: Response) =>
        response.statusText ===
        `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te bekijken.`,
    );
  });
});

describe("canTriggerDestructionRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    vi.mocked(canTriggerDestruction).mockReturnValueOnce(true);

    await canTriggerDestructionRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    vi.mocked(whoAmI).mockResolvedValueOnce(user);
    vi.mocked(canTriggerDestruction).mockReturnValueOnce(false);

    const wrappedLoader = canTriggerDestructionRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toSatisfy(
      (response: Response) =>
        response.statusText ===
        `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te vernietigen.`,
    );
  });
});

describe("canViewAndEditSettingsRequired", () => {
  it("should call the loader if the user is permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    vi.mocked(canChangeSettings).mockReturnValueOnce(true);

    await canViewAndEditSettingsRequired(loader)({
      request: {
        url: "http://zaken.nl",
      } as unknown as Request,
      params: {},
    });

    expect(loader).toHaveBeenCalled();
  });

  it("should respond with a 403 if the user is not permitted", async () => {
    const loader = vi.fn().mockReturnValueOnce({ destructionList: {} });
    const user = userFactory();
    vi.mocked(whoAmI).mockResolvedValueOnce(user);
    vi.mocked(canChangeSettings).mockReturnValueOnce(false);

    const wrappedLoader = canViewAndEditSettingsRequired(loader);

    await expect(
      wrappedLoader({
        request: {
          url: "http://zaken.nl",
        } as unknown as Request,
        params: {},
      }),
    ).rejects.toSatisfy(
      (response: Response) =>
        response.statusText ===
        `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om de instellingen te wijzigen.`,
    );
  });
});
