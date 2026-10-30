import { describe, expect, it } from "vitest";

import {
  ProcessZaakFormState,
  getFormMutation,
} from "./DestructionListProcessZaakReviewModal";

const initialValues: ProcessZaakFormState = {
  zaakUrl: "http://example.com",
  action: "",
  selectielijstklasse: "1.1.1 - Ingericht - blijvend_bewaren",
  resultaattype: "Ingesteld",
  archiefactiedatum: "",
  comment: "",
};

const initialArchiefactiedatum = "2024-01-01";

describe("getFormMutation", () => {
  it("resets resultaattype and derives archiefactiedatum when selectielijstklasse is changed", () => {
    const values: ProcessZaakFormState = {
      ...initialValues,
      action: "change_selectielijstklasse",
      selectielijstklasse: "1.1 - Ingericht - vernietigen - P10Y",
      comment: "Change selectielijstklasse",
    };

    expect(
      getFormMutation(values, initialValues, initialArchiefactiedatum, "P10Y"),
    ).toEqual({
      resultaattype: "",
      archiefactiedatum: "2034-01-01",
      archiefactiedatumSource: "selectielijstklasse",
    });
  });

  it("changes source from selectielijstklasse to user when user changes both selectielijstklasse and the date", () => {
    const values: ProcessZaakFormState = {
      ...initialValues,
      action: "change_selectielijstklasse",
      selectielijstklasse: "1.1 - Ingericht - vernietigen - P10Y",
      archiefactiedatum: "2035-09-15",
      comment: "Change selectielijstklasse and archiefactiedatum",
    };

    expect(
      getFormMutation(values, initialValues, initialArchiefactiedatum, "P10Y"),
    ).toEqual({
      resultaattype: "",
      archiefactiedatumSource: "user",
    });
  });

  it("marks archiefactiedatum as user provided when user changes the date", () => {
    const values: ProcessZaakFormState = {
      ...initialValues,
      action: "change_archiefactiedatum",
      archiefactiedatum: "2035-09-15",
      comment: "Change archiefactiedatum",
    };

    expect(
      getFormMutation(values, initialValues, initialArchiefactiedatum, "P10Y"),
    ).toEqual({
      archiefactiedatumSource: "user",
    });
  });

  it("clears archiefactiedatum when selectielijstklasse has no bewaartermijn", () => {
    const values: ProcessZaakFormState = {
      ...initialValues,
      action: "change_selectielijstklasse",
      selectielijstklasse: "1.1.2 - Ingericht - blijvend_bewaren",
    };

    expect(getFormMutation(values, initialValues, "2024-01-01", null)).toEqual({
      resultaattype: "",
      archiefactiedatum: "",
      archiefactiedatumSource: "selectielijstklasse",
    });
  });

  it("does not return a mutation when no relevant values changed", () => {
    expect(
      getFormMutation(
        initialValues,
        initialValues,
        initialArchiefactiedatum,
        "P10Y",
      ),
    ).toEqual({});
  });
});
