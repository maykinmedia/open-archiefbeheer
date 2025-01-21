import { destructionListFactory } from "../../fixtures";
import {
  DestructionListUpdateData,
  updateDestructionList,
} from "../../lib/api/destructionLists";
import { collectErrors } from "../../lib/format/error";

jest.mock("../../lib/api/destructionLists", () => ({
  updateDestructionList: jest.fn(),
}));

jest.mock("../../lib/format/error", () => ({
  collectErrors: jest.fn(),
}));

export const createHandleSubmit = (
  destructionList: { uuid: string } | undefined,
  revalidator: { revalidate: () => void },
  alert: (title: string, message: string, buttonLabel: string) => void,
) => {
  return async (data: { name: string }) => {
    if (!destructionList) {
      return;
    }

    try {
      await updateDestructionList(
        destructionList.uuid,
        data as DestructionListUpdateData,
      );
      revalidator.revalidate();
    } catch (e) {
      console.error(e);

      try {
        const errorResponse = await (e as Response).json();
        const errors = collectErrors(errorResponse);
        alert("Foutmelding", errorResponse.detail || errors, "Ok");
      } catch {
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het bewerken van de naam van de vernietigingslijst.",
          "Ok",
        );
      }
    }
  };
};

describe("destructionListToolbarSubmit", () => {
  const destructionList = destructionListFactory();
  const revalidator = { revalidate: jest.fn() };
  const alertMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call updateDestructionList and revalidate on success", async () => {
    (updateDestructionList as jest.Mock).mockResolvedValueOnce({});

    const handleSubmit = createHandleSubmit(
      destructionList,
      revalidator,
      alertMock,
    );
    await handleSubmit({ name: "Updated Name" });

    expect(updateDestructionList).toHaveBeenCalledWith(destructionList.uuid, {
      name: "Updated Name",
    });
    expect(revalidator.revalidate).toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });

  it("should show an error alert on API failure with detailed error message", async () => {
    (updateDestructionList as jest.Mock).mockRejectedValueOnce({
      json: async () => ({
        detail:
          "Er is een fout opgetreden bij het bewerken van de naam van de vernietigingslijst.",
      }),
    });

    const handleSubmit = createHandleSubmit(
      destructionList,
      revalidator,
      alertMock,
    );
    await handleSubmit({ name: "Failed Update" });

    expect(updateDestructionList).toHaveBeenCalledWith(destructionList.uuid, {
      name: "Failed Update",
    });
    expect(alertMock).toHaveBeenCalledWith(
      "Foutmelding",
      "Er is een fout opgetreden bij het bewerken van de naam van de vernietigingslijst.",
      "Ok",
    );
    expect(revalidator.revalidate).not.toHaveBeenCalled();
  });

  it("should show a generic error alert when error details are unavailable", async () => {
    (updateDestructionList as jest.Mock).mockRejectedValueOnce(
      new Error("Unexpected error"),
    );

    const handleSubmit = createHandleSubmit(
      destructionList,
      revalidator,
      alertMock,
    );
    await handleSubmit({ name: "Failed Update" });

    expect(updateDestructionList).toHaveBeenCalledWith(destructionList.uuid, {
      name: "Failed Update",
    });
    expect(alertMock).toHaveBeenCalledWith(
      "Foutmelding",
      "Er is een fout opgetreden bij het bewerken van de naam van de vernietigingslijst.",
      "Ok",
    );
    expect(revalidator.revalidate).not.toHaveBeenCalled();
  });

  it("should do nothing if destructionList is undefined", async () => {
    const handleSubmit = createHandleSubmit(undefined, revalidator, alertMock);
    await handleSubmit({ name: "No Operation" });

    expect(updateDestructionList).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
    expect(revalidator.revalidate).not.toHaveBeenCalled();
  });
});
