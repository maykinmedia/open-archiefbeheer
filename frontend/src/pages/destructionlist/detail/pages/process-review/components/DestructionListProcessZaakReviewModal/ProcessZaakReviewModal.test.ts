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
const initialArchiefactiedatumSource = "zaak";

describe("getFormMutation", () => {
  it("resets resultaattype and derives archiefactiedatum when selectielijstklasse is changed", () => {
    const values: ProcessZaakFormState = {
      ...initialValues,
      action: "change_selectielijstklasse",
      selectielijstklasse: "1.1 - Ingericht - vernietigen - P10Y",
      comment: "Change selectielijstklasse",
    };

    expect(
      getFormMutation(
        values,
        initialValues,
        initialValues,
        initialArchiefactiedatumSource,
        initialArchiefactiedatum,
        "P10Y",
      ),
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
      getFormMutation(
        values,
        initialValues,
        initialValues,
        initialArchiefactiedatumSource,
        initialArchiefactiedatum,
        "P10Y",
      ),
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
      getFormMutation(
        values,
        initialValues,
        initialValues,
        initialArchiefactiedatumSource,
        initialArchiefactiedatum,
        "P10Y",
      ),
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

    expect(
      getFormMutation(
        values,
        initialValues,
        initialValues,
        initialArchiefactiedatumSource,
        "2024-01-01",
        null,
      ),
    ).toEqual({
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
        initialValues,
        initialArchiefactiedatumSource,
        initialArchiefactiedatum,
        "P10Y",
      ),
    ).toEqual({});
  });

  it("restores initial values when the selectielijstklasse is reverted", () => {
    const previousValues: ProcessZaakFormState = {
      ...initialValues,
      action: "change_selectielijstklasse",
      selectielijstklasse: "1.1 - Ingericht - vernietigen - P10Y",
      resultaattype: "Another resultaattype",
      archiefactiedatum: "2034-01-01",
    };

    const values: ProcessZaakFormState = {
      ...previousValues,
      selectielijstklasse: initialValues.selectielijstklasse,
    };

    expect(
      getFormMutation(
        values,
        previousValues,
        initialValues,
        initialArchiefactiedatumSource,
        initialArchiefactiedatum,
        null,
      ),
    ).toEqual({
      resultaattype: initialValues.resultaattype,
      archiefactiedatum: initialValues.archiefactiedatum,
      archiefactiedatumSource: "zaak",
    });
  });

  it("restores the initial source when archiefactiedatum is reverted", () => {
    const previousValues: ProcessZaakFormState = {
      ...initialValues,
      action: "change_archiefactiedatum",
      archiefactiedatum: "2035-09-15",
    };

    const values: ProcessZaakFormState = {
      ...previousValues,
      archiefactiedatum: initialValues.archiefactiedatum,
    };

    expect(
      getFormMutation(
        values,
        previousValues,
        initialValues,
        initialArchiefactiedatumSource,
        initialArchiefactiedatum,
      ),
    ).toEqual({
      archiefactiedatumSource: "zaak",
    });
  });

  it("restores selectielijstklasse source when user reverts to the derived date", () => {
    const previousValues: ProcessZaakFormState = {
      ...initialValues,
      action: "change_selectielijstklasse",
      selectielijstklasse: "1.1 - Ingericht - vernietigen - P10Y",
      archiefactiedatum: "2035-09-15",
    };

    const values: ProcessZaakFormState = {
      ...previousValues,
      archiefactiedatum: "2034-01-01",
    };

    expect(
      getFormMutation(
        values,
        previousValues,
        initialValues,
        initialArchiefactiedatumSource,
        initialArchiefactiedatum,
        "P10Y",
      ),
    ).toEqual({
      archiefactiedatumSource: "selectielijstklasse",
    });
  });
});
