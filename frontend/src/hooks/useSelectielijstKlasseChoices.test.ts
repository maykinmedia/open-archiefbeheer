import { renderHook, waitFor } from "@testing-library/react";

import { FIXTURE_SELECTIELIJSTKLASSE_CHOICES } from "../fixtures";
import { listSelectielijstKlasseChoices } from "../lib/api/private";
import {
  mockRejectOnce,
  mockResponseOnce,
  resetMocks,
} from "../lib/test/mockResponse";
import { useDataFetcher } from "./useDataFetcher";

const MockSelectieLijstKlasseChoicesHook = () => {
  return useDataFetcher(
    (signal) => listSelectielijstKlasseChoices(undefined, true, signal),
    {
      initialState: [],
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van selectielijst klassen!",
    },
    [],
  );
};
const mockAlert = vi.fn();

vi.mock("@maykin-ui/admin-ui", () => ({
  useAlert: () => mockAlert,
}));

describe("useSelectielijstKlasseChoices Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  it("should show an error message when fetching selectielijst klasse has failed", async () => {
    mockRejectOnce(
      "get",
      "http://localhost:8000/api/v1/_selectielijstklasse-choices/",
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderHook(() => MockSelectieLijstKlasseChoicesHook());

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Foutmelding",
        "Er is een fout opgetreden bij het ophalen van selectielijst klassen!",
        "Ok",
        undefined,
      );
    });
  });

  it("return the selectielijst klasse choices when fetching is successful", async () => {
    mockResponseOnce(
      "get",
      "http://localhost:8000/api/v1/_selectielijstklasse-choices/",
      FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
    );

    const { result } = renderHook(() => MockSelectieLijstKlasseChoicesHook());

    await waitFor(() => {
      expect(result.current.data).toEqual(FIXTURE_SELECTIELIJSTKLASSE_CHOICES);
    });
  });
});
