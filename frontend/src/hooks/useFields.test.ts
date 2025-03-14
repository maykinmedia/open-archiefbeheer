import { TypedField } from "@maykin-ui/admin-ui";
import { act, renderHook, waitFor } from "@testing-library/react";

import * as fieldSelection from "../lib/fieldSelection/fieldSelection";
import { useFields } from "./useFields";

let mockUrlSearchParams = new URLSearchParams();

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [
    mockUrlSearchParams,
    (params: Record<string, string>) => {
      mockUrlSearchParams = new URLSearchParams(params);
    },
  ],
}));

describe.only("useFields Hook", () => {
  it("should initialize with default fields and handle field selection", async () => {
    // Render the hook
    const { result } = renderHook(() => useFields());
    const [fields, setFields] = result.current;
    const activeFields = fields.filter((f) => f.active);

    // Verify initial fields are set with proper selections
    expect(activeFields).toHaveLength(9);
    expect(fields[0].name).toBe("identificatie");

    // Mock the field selection change
    const updatedFields = [...fields];
    updatedFields[0].active = false; // Set first field as inactive

    // Act to simulate setting fields
    await act(async () => {
      await setFields(updatedFields);
    });
  });

  it("should persist changes to fieldSelection", async () => {
    // Render the hook
    const { result } = renderHook(() => useFields());
    const [fields, setFields] = result.current;

    vi.spyOn(fieldSelection, "addToFieldSelection");
    vi.spyOn(fieldSelection, "removeFromFieldSelection");

    const updatedFields = [...fields];
    const firstActive = updatedFields?.find((f) => f.active) as TypedField;
    const firstInactive = updatedFields?.find((f) => !f.active) as TypedField;
    firstActive.active = true;
    firstInactive.active = true;

    // Act to simulate setting fields
    await act(async () => {
      await setFields(updatedFields);
    });

    // Verify the changes.
    expect(fieldSelection.addToFieldSelection).toHaveBeenCalled();
    expect(fieldSelection.removeFromFieldSelection).toHaveBeenCalled();
  });

  it("should apply search params to filter values", async () => {
    // Render the hook
    mockUrlSearchParams.set("identificatie__icontains", "test-id");
    const { result } = renderHook(() => useFields());

    // Wait for the state to update, in case the hook has async logic
    await waitFor(() => {
      const [fields] = result.current;

      // Verify the fields with search param value
      expect(fields[0].filterValue).toBe("test-id"); // The identificatie field should use the search param value
    });
  });

  it("should apply filter transformations correctly", async () => {
    const { result } = renderHook(() => useFields());

    await waitFor(async () => {
      const [, , filterTransform] = result.current;

      const filterData = {
        startdatum: [new Date("2023-01-01"), new Date("2023-01-31")],
        einddatum: [new Date("2023-02-01"), new Date("2023-02-28")],
      };

      const transformedData = filterTransform(filterData);

      // Expect the transformed data to split date ranges
      expect(transformedData.startdatum__gte).toBe("2023-01-01");
      expect(transformedData.startdatum__lte).toBe("2023-01-31");
      expect(transformedData.einddatum__gte).toBe("2023-02-01");
      expect(transformedData.einddatum__lte).toBe("2023-02-28");
    });
  });
});

describe("useFields Hook", () => {
  it.only("should provide selectielijstklasse options to selectielijstklasse field", async () => {
    vi.mock("./useDataFetcher", () => ({
      useDataFetcher: vi.fn().mockReturnValue({
        data: [{ value: "https://" }],
        loading: false,
        error: false,
      }),
    }));

    const { result } = await act(async () => renderHook(() => useFields()));
    const [fields] = result.current;
    const selectielijstKlasse = fields.find(
      (f) => f.name === "selectielijstklasse",
    );

    expect(selectielijstKlasse?.options?.length).toBeTruthy();
    expect(selectielijstKlasse?.options?.[0].value).toContain("https://");
  });
});
