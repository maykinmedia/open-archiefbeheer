import { renderHook, waitFor } from "@testing-library/react";
import exp from "node:constants";

import { FIXTURE_SELECTIELIJSTKLASSE_CHOICES } from "../../../fixtures/selectieLijstKlasseChoices";
import { useFields } from "./useFields";
import { useSelectielijstKlasseChoices } from "./useSelectielijstKlasseChoices";

const mockAlert = jest.fn();

jest.mock("@maykin-ui/admin-ui", () => ({
  useAlert: () => mockAlert,
}));

const fetch = jest.spyOn(window, "fetch");
const error = jest.spyOn(console, "error");

describe("useSelectielijstKlasseChoices Hook", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should show an error message when fetching selectielijst klasse has failed", async () => {
    fetch.mockReturnValue(
      Promise.resolve({
        ok: false,
      } as Response),
    );
    error.mockImplementation(() => undefined);
    renderHook(() => useSelectielijstKlasseChoices());

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Foutmelding",
        "Er is een fout opgetreden bij het ophalen van selectielijst klassen!",
        "Ok",
      );
    });
  });

  it("return the selectielijst klasse choices when fetching is successful", async () => {
    fetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: async () => FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
      } as Response),
    );
    error.mockImplementation(() => undefined);

    const { result } = renderHook(() => useSelectielijstKlasseChoices());

    // const selectielijstKlasseChoices = result.current;
    await waitFor(() => {
      const selectielijstKlasseChoices = result.current;
      expect(selectielijstKlasseChoices).toEqual(
        FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
      );
    });
  });
});
