import {
  Body,
  Column,
  ErrorMessage,
  Form,
  FormField,
  Grid,
  H3,
  Hr,
  Modal,
  Option,
  P,
  SerializedFormData,
  Validator,
  validateForm,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useEffect, useState } from "react";

import { ReviewItem } from "../../../../../../../lib/api/review";
import { SelectielijstklasseOption } from "../../../../../../../lib/api/types";
import { addDuration, formatDate } from "../../../../../../../lib/format/date";
import { Zaak } from "../../../../../../../types";

export const LABEL_CHANGE_SELECTION_LIST_CLASS =
  "Selectielijstklasse aanpassen";
export const LABEL_CHANGE_ARCHIVING_DATE = "Archiefactiedatum aanpassen";
export const LABEL_KEEP = "Voorstel afwijzen";

export type ArchiefactiedatumSource =
  | "zaak" // original value
  | "selectielijstklasse" // derived from Selectielijst API
  | "user"; // explicitly edited, submit it

type DestructionListProcessZaakReviewModalFormType = {
  zaakUrl: string;
  action: string;
  selectielijstklasse: string;
  resultaattype: string;
  archiefactiedatum: string;
  comment: string;
};

export type DestructionListProcessZaakReviewModalProps = {
  zaakModalDataState: {
    open: boolean;
    zaak?: Zaak;
  };
  reviewItem: ReviewItem | null;
  action?: ProcessReviewAction;
  selectielijstklasse: string;
  selectieLijstKlasseChoices: SelectielijstklasseOption[];
  resultaattype: string;
  archiefactiedatum: string;
  archiefactiedatumSource?: ArchiefactiedatumSource;
  comment?: string;
  onClose: () => void;
  onSubmit: (
    zaakUrl: string,
    processAction: ProcessReviewAction,
    selectielijstklasse: string,
    resultaattype: string,
    archiefactiedatum: string | undefined,
    archiefactiedatumSource: ArchiefactiedatumSource,
    comment: string,
  ) => void;
};

export type ProcessReviewAction =
  | "change_selectielijstklasse"
  | "change_archiefactiedatum"
  | "keep";

export type ProcessZaakFormState = {
  zaakUrl: string;
  action: ProcessReviewAction | "";
  selectielijstklasse: string;
  resultaattype: string;
  archiefactiedatum: string;
  comment: string;
};

type FormMutation = {
  resultaattype?: string;
  archiefactiedatum?: string;
  archiefactiedatumSource?: ArchiefactiedatumSource;
};

/**
 * Determines which form values need to be updated after a user interaction.
 *
 * Returns only the fields that need to override the current form values
 * and archiefactiedatum source.
 */
export function getFormMutation(
  values: ProcessZaakFormState,
  previousValues: ProcessZaakFormState,
  initialValues: ProcessZaakFormState,
  initialArchiefactiedatumSource: ArchiefactiedatumSource,
  zaakStartDatumBewaarTermijn: string,
  bewaartermijn?: string | null,
): FormMutation {
  const mutation: FormMutation = {};

  //
  // Determine what the user changed before applying any derived mutations.
  // TODO: consider comparing against `initialValues` instead.
  //

  // Selectielijstklasse does not match previous value.
  const isSelectielijstklasseChanged =
    values.selectielijstklasse !== previousValues.selectielijstklasse;

  // Archiefactiedatum does not match previous value.
  const isArchiefactiedatumChanged =
    values.archiefactiedatum !== previousValues.archiefactiedatum;

  // Selectielijstklasse was changed, but is reverted back to the initial state
  const isSelectielijstklasseReverted =
    values.selectielijstklasse === initialValues.selectielijstklasse;

  // calculate the archive date based on selectielijstklasse from Selectielijst API
  const derivedArchiefactiedatum =
    zaakStartDatumBewaarTermijn && bewaartermijn
      ? formatDate(
          addDuration(zaakStartDatumBewaarTermijn, bewaartermijn),
          "iso",
        )
      : "";

  // If: the selectielijstklasse is changed, there are 2 possible scenario's:
  //
  // - Scenario 1: a previous change exists, and is reverted to the initial value.
  //   - Apply initial resultaattype/archiefactiedatum values to the `mutation`.
  //   - Set `mutation.archiefactiedatumSource` to `initialArchiefactiedatumSource` (the first known value).
  //
  // - Scenario 2: the selectielijst is changed to a non-initial value.
  //   - Clear the resultaattype value.
  //   - Set `mutation.archiefactiedatum` to `derivedArchiefactiedatum`.
  //   - Set `mutation.archiefactiedatumSource` to "selectielijstklasse" (selectielijst determines value).
  if (isSelectielijstklasseChanged) {
    // Scenario 1
    if (isSelectielijstklasseReverted) {
      // The user reverts to the original selectielijstklasse - we restore the values to the initial
      mutation.resultaattype = initialValues.resultaattype;
      mutation.archiefactiedatum = initialValues.archiefactiedatum;
      mutation.archiefactiedatumSource = initialArchiefactiedatumSource;
    }
    // Scenario 2
    else {
      // A different selectielijstklasse requires a new resultaattype.
      mutation.resultaattype = "";
      // If the selectielijstklasse is changed, and all fields are available:
      // update the archive date based on the selectielijstklasse.
      mutation.archiefactiedatum = derivedArchiefactiedatum;
      mutation.archiefactiedatumSource = "selectielijstklasse";
    }
  }

  // If: the archiefactiedatum is changed (manually), there are 2 possible scenario's:
  //
  // - Scenario 1: The new archiefactie datum matches either initial or selectielijst-calculated value.
  //   - Scenario 1.1: The previous change was a selectielijst revert.
  //     - Set `mutation.archiefactiedatumSource` to `initialArchiefactiedatumSource` (the first known value).
  //     - delete `mutation.archiefactiedatum`, preserving manually set value.
  //   - Scenario 1.2: The previous change was a selectielijst change.
  //     - Set `mutation.archiefactiedatumSource` to "selectielijstklasse"
  //     - delete `mutation.archiefactiedatum`, preserving manually set value.
  //
  // - Scenario 2: The user (manually) changed the archiving date.
  //     - Set `mutation.archiefactiedatumSource` to "user"
  //     - delete `mutation.archiefactiedatum`, preserving manually set value.
  if (isArchiefactiedatumChanged) {
    /*
     * This branch is only reached when the archive date itself changed,
     * in 'change_selectielijstklasse' or in 'change_archiefactiedatum' action
     * rather than being updated as a consequence of selecting another
     * selectielijstklasse.
     */
    const expectedArchiefactiedatum = isSelectielijstklasseReverted
      ? initialValues.archiefactiedatum
      : derivedArchiefactiedatum;

    // Scenario 1
    if (values.archiefactiedatum === expectedArchiefactiedatum) {
      // The user restored the original or system-derived date.
      mutation.archiefactiedatumSource = isSelectielijstklasseReverted
        ? initialArchiefactiedatumSource // Scenario 1.1
        : "selectielijstklasse"; // Scenario 1.2
    }
    // Scenario 2
    else {
      // The user explicitly entered a different date.
      mutation.archiefactiedatumSource = "user";
    }

    // Keep the value from `values`; don't overwrite it with the derived date.
    delete mutation.archiefactiedatum;
  }
  return mutation;
}

/**
 * A modal allowing the user to process (review) feedback of a zaak.
 */
export const DestructionListProcessZaakReviewModal: React.FC<
  DestructionListProcessZaakReviewModalProps
> = ({
  zaakModalDataState: { open, zaak },
  reviewItem,
  action,
  selectielijstklasse,
  selectieLijstKlasseChoices,
  resultaattype,
  archiefactiedatum,
  archiefactiedatumSource = "zaak",
  comment,
  onClose,
  onSubmit,
}) => {
  const initialFormState: ProcessZaakFormState = {
    zaakUrl: zaak?.url || "",
    action: action || "",
    selectielijstklasse: selectielijstklasse,
    resultaattype: resultaattype,
    archiefactiedatum: archiefactiedatum,
    comment: comment || "",
  };
  // Form state, kept outside <Form/> to implement conditional fields (see `getFields()`).
  const [formState, setFormState] =
    useState<ProcessZaakFormState>(initialFormState);
  const [archiefactiedatumSourceState, setArchiefactiedatumSourceState] =
    useState<ArchiefactiedatumSource>(archiefactiedatumSource);

  const getSelectielijstklasseValue = (
    selectielijstklasseChoice: string,
  ): string => {
    // The first time a zaak is selected, the label of the choice is passed.
    // When the user interacts with the dropdown, the value is passed.
    const selectedChoice = selectieLijstKlasseChoices.find((choice) =>
      [choice.label, choice.value].includes(selectielijstklasseChoice),
    );
    return selectedChoice?.value || "";
  };

  // the same logic as in loader
  const zaakSelectielijstklasse =
    zaak?.selectielijstklasse ||
    // @ts-expect-error - same typing issue as in useFields
    zaak?._expand?.resultaat?._expand?.resultaattype?.selectielijstklasse ||
    "";

  // Update the form state based on props.
  useEffect(() => {
    const newFormState: ProcessZaakFormState = {
      ...initialFormState,
      action: action || initialFormState.action,
      selectielijstklasse:
        getSelectielijstklasseValue(selectielijstklasse) ||
        initialFormState.selectielijstklasse,
      resultaattype: resultaattype || initialFormState.resultaattype,
      archiefactiedatum:
        archiefactiedatum || initialFormState.archiefactiedatum,
      comment: comment || initialFormState.comment,
    };

    setFormState(newFormState);
    setArchiefactiedatumSourceState(archiefactiedatumSource);
  }, [
    action,
    selectielijstklasse,
    resultaattype,
    archiefactiedatum,
    archiefactiedatumSource,
    comment,
  ]);

  // Show an error if zaak and review item are out of sync (this should not happen).
  if (open && !reviewItem) {
    return (
      <Modal allowClose={false} open={true} title="Foutmelding">
        <Body>
          <ErrorMessage>
            Kon geen review item vinden voor zaak: {zaak?.identificatie}
          </ErrorMessage>
        </Body>
      </Modal>
    );
  }

  /**
   * Returns the archiefnominatie (waardering) for the selected selectielijstklasse.
   * @param selectielijstklasseUrl - The selectielijstklasse URL
   * @return "blijvend_bewaren" or "vernietigen"
   */
  function getArchiefnominatie(
    selectielijstklasseUrl: string,
  ): SelectielijstklasseOption["extraData"]["waardering"] | null {
    const selectedChoice = getSelectielijstklasseOption(selectielijstklasseUrl);
    return selectedChoice?.extraData?.waardering || null;
  }

  /**
   * Returns the bewaartermijn (e.g. "P5Y") for the selected selectielijstklasse.
   * @param selectielijstklasseUrl - The selectielijstklasse URL
   * @return ISO 8601 duration format if applicable.
   * @return
   *  - ISO 8601 duration format if applicable.
   *  - `null` if no selectielijstklasse option is found.
   */
  function getBewaartermijn(selectielijstklasseUrl: string): string | null {
    const selectedChoice = getSelectielijstklasseOption(selectielijstklasseUrl);
    return selectedChoice?.extraData?.bewaartermijn || null;
  }

  /**
   * Returns the resultaattype options for the selected selectielijstklasse.
   * @param selectielijstklasseUrl - The selectielijstklasse URL
   * @return Array resultaat type options.
   */
  function getResultaattypeOptions(selectielijstklasseUrl: string): Option[] {
    const selectedChoice = getSelectielijstklasseOption(selectielijstklasseUrl);
    return selectedChoice?.extraData?.resultaattypen || [];
  }

  /**
   * Returns the `SelectielijstklasseOption` based on `selectielijstklasseUrl`.
   * @param selectielijstklasseUrl - The selectielijstklasse URL
   * @throws Error - When no `SelectielijstklasseOption` matching `selectielijstklasseUrl` is found.
   * @return
   *  - Selectielijstklasse option if applicable
   *  - `null` if no selectielijstklasse option is found.
   */
  function getSelectielijstklasseOption(
    selectielijstklasseUrl: string,
  ): SelectielijstklasseOption | null {
    const selectedChoice = selectieLijstKlasseChoices.find(
      (choice) => choice.value === selectielijstklasseUrl,
    );

    return selectedChoice || null;
  }

  /**
   * Returns the `FormField[]` to show in the modal after selecting a Zaak (when processing review).
   */
  function getFields({
    action,
    archiefactiedatum,
    comment,
    selectielijstklasse,
    resultaattype,
  }: ProcessZaakFormState) {
    const archiefnominatie = getArchiefnominatie(selectielijstklasse);
    const bewaartermijn = getBewaartermijn(selectielijstklasse);
    const resultaattypeOptions = getResultaattypeOptions(selectielijstklasse);

    const changeSelectielijstklasseSelected =
      action === "change_selectielijstklasse";

    // Whether to allow changing the archiving date
    // - When: selectielijst `bewaartermijn` is resolved as truthy value.
    // - OR:   `archiefnominatie` is set to "vernietigen".  FIXME: Remove this check as is redundant?
    const showChangeArchiefactiedatumOption =
      Boolean(bewaartermijn) || archiefnominatie === "vernietigen";

    // Whether to show the "archiefactiedatum" input
    // - When: `action` is set to "change_archiefactiedatum".
    // - OR: selectielijst `bewaartermijn` is resolved as truthy value.
    const showArchiefactiedatumInput =
      action === "change_archiefactiedatum" ||
      (changeSelectielijstklasseSelected && Boolean(bewaartermijn));

    // Fields always visible in the modal.
    const baseFields: FormField[] = [
      {
        label: "",
        name: "zaakUrl",
        type: "hidden",
        value: zaak?.url,
      },

      {
        label: "Actie",
        name: "action",
        required: true,
        value: action,
        type: "radio",
        options: [
          {
            label: LABEL_CHANGE_SELECTION_LIST_CLASS,
            value: "change_selectielijstklasse",
            selected: action === "change_selectielijstklasse",
          },
          showChangeArchiefactiedatumOption
            ? {
                label: LABEL_CHANGE_ARCHIVING_DATE,
                value: "change_archiefactiedatum",
                selected: action === "change_archiefactiedatum",
              }
            : null,
          {
            label: LABEL_KEEP,
            value: "keep",
            selected: action === "keep",
          },
        ].filter((v: Option | null): v is Option => Boolean(v)) as Option[],
      },

      // Note: do not remove these fields completely to enable remembering
      // previously selected values when switching the "action".
      {
        label: changeSelectielijstklasseSelected
          ? "Selectielijstklasse"
          : undefined,
        name: "selectielijstklasse",
        required: changeSelectielijstklasseSelected,
        type: changeSelectielijstklasseSelected ? undefined : "hidden",
        options: changeSelectielijstklasseSelected
          ? selectieLijstKlasseChoices.filter(
              (choice) => choice.value !== zaakSelectielijstklasse,
            )
          : undefined,
        value: selectielijstklasse,
      },

      {
        label: changeSelectielijstklasseSelected ? "Resultaattype" : undefined,
        name: "resultaattype",
        required:
          // Only required when we actually have corresponding resultaattypen
          // available
          changeSelectielijstklasseSelected && resultaattypeOptions.length > 0,
        type: changeSelectielijstklasseSelected ? undefined : "hidden",
        options: changeSelectielijstklasseSelected
          ? resultaattypeOptions
          : undefined,
        value: resultaattype,
      },

      {
        label: showArchiefactiedatumInput ? "Archiefactiedatum" : undefined,
        name: "archiefactiedatum",
        required: showArchiefactiedatumInput,
        type: showArchiefactiedatumInput ? "date" : "hidden",
        value: archiefactiedatum,
      },
    ];

    // Fields shown when an action is selected (regardless of the action).
    const actionSelectedFields: FormField[] = [
      {
        label: "Reden",
        name: "comment",
        required: true,
        value: comment,
      },
    ];

    return [...baseFields, ...(action ? actionSelectedFields : [])];
  }

  /**
   * Updates the form state, and validates the form.
   * @param values
   * @param _
   * @param validators
   */
  function validate(
    values: DestructionListProcessZaakReviewModalFormType,
    _: FormField[],
    validators?: Validator[],
  ) {
    const bewaartermijn = getBewaartermijn(
      values.selectielijstklasse as string,
    );

    const {
      archiefactiedatumSource: nextArchiefactiedatumSource,
      ...formMutation
    } = getFormMutation(
      values as ProcessZaakFormState,
      formState,
      initialFormState,
      archiefactiedatumSource,
      zaak?.startdatumBewaartermijn || archiefactiedatum || "",
      bewaartermijn,
    );

    const nextValues: ProcessZaakFormState = {
      ...(values as ProcessZaakFormState),
      ...formMutation,
    };

    setFormState(nextValues);

    if (nextArchiefactiedatumSource) {
      setArchiefactiedatumSourceState(nextArchiefactiedatumSource);
    }
    return validateForm(nextValues, getFields(nextValues), validators);
  }

  /**
   * Gets called when the form is submitted.
   * @param _
   * @param data
   */
  const handleSubmit = (_: FormEvent, data: SerializedFormData) => {
    const {
      zaakUrl,
      action,
      selectielijstklasse,
      resultaattype,
      archiefactiedatum,
      comment,
    } = data as ProcessZaakFormState;
    onSubmit(
      zaakUrl as string,
      action as ProcessReviewAction,
      selectielijstklasse,
      resultaattype,
      archiefactiedatum || undefined,
      archiefactiedatumSourceState,
      comment,
    );
  };

  // The `open &&` is here to ensure that when closing an item and opening another, they don't interfere with each other.
  // Otherwise, the radio button remains checked with the submitted value of the previous item.
  // Prevent issues with unmanaged form by re-rendering after toggle.
  // Without this, a different zaak can inherit the previous state.
  if (!open) {
    return null;
  }

  return (
    <>
      {open && (
        <Modal
          open={open}
          size="m"
          title={`${zaak?.identificatie} muteren`}
          onClose={onClose}
        >
          <Body>
            <Grid>
              <Column span={3}>
                <H3>Beoordeling</H3>
              </Column>

              <Column span={9}>
                <P bold>Opmerkingen</P>
                <P muted>{reviewItem?.feedback}</P>
              </Column>
            </Grid>

            <Hr />

            <Grid>
              <Column span={3}>
                <H3>Wijzigingen</H3>
              </Column>

              <Column span={9}>
                <Form<DestructionListProcessZaakReviewModalFormType>
                  aria-label={`${zaak?.identificatie} muteren`}
                  autoComplete="off"
                  fields={getFields(formState)}
                  initialValues={initialFormState}
                  justify="stretch"
                  labelSubmit={`${zaak?.identificatie} muteren`}
                  noValidate
                  validate={validate}
                  validateOnChange={true}
                  showRequiredExplanation={false}
                  onSubmit={handleSubmit}
                />
              </Column>
            </Grid>
          </Body>
        </Modal>
      )}
    </>
  );
};
export default DestructionListProcessZaakReviewModal;
