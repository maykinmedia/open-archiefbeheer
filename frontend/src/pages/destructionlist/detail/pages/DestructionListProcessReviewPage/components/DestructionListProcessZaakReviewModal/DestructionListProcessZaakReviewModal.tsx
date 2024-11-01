import {
  AttributeData,
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
  validateForm,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useEffect, useState } from "react";

import { ReviewItem } from "../../../../../../../lib/api/review";
import { addDuration, formatDate } from "../../../../../../../lib/format/date";
import { Zaak } from "../../../../../../../types";

export const LABEL_CHANGE_SELECTION_LIST_CLASS =
  "Aanpassen van selectielijstklasse";
export const LABEL_POSTPONE_DESTRUCTION = "Verlengen bewaartermijn";
export const LABEL_KEEP = "Afwijzen van het voorstel";

export type DestructionListProcessZaakReviewModalProps = {
  zaakModalDataState: {
    open: boolean;
    zaak?: Zaak;
  };
  reviewItem: ReviewItem | null;
  action?: ProcessReviewAction;
  selectielijstklasse: string;
  selectieLijstKlasseChoices: Option[];
  archiefactiedatum: string;
  comment?: string;
  onClose: () => void;
  onSubmit: (
    zaakUrl: string,
    processAction: ProcessReviewAction,
    selectielijstklasse: string,
    archiefactiedatum: string | undefined,
    comment: string,
  ) => void;
};

export type ProcessReviewAction =
  | "change_selectielijstklasse"
  | "change_archiefactiedatum"
  | "keep";

type ProcessZaakFormState = {
  zaakUrl: string;
  action: ProcessReviewAction | "";
  selectielijstklasse: string;
  archiefactiedatum: string;
  comment: string;
};

/**
 * A modal allowing the user to process (review) feedback of a zaak.
 * @param open
 * @param zaak
 * @param reviewItem
 * @param selectielijstklasseChoices
 */
export const DestructionListProcessZaakReviewModal: React.FC<
  DestructionListProcessZaakReviewModalProps
> = ({
  zaakModalDataState: { open, zaak },
  reviewItem,
  action,
  selectielijstklasse,
  selectieLijstKlasseChoices,
  archiefactiedatum,
  comment,
  onClose,
  onSubmit,
}) => {
  const initialFormState: ProcessZaakFormState = {
    zaakUrl: zaak?.url || "",
    action: action || "",
    selectielijstklasse: selectielijstklasse,
    archiefactiedatum: archiefactiedatum,
    comment: comment || "",
  };
  // Form state, kept outside <Form/> to implement conditional fields (see `getFields()`).
  const [formState, setFormState] =
    useState<ProcessZaakFormState>(initialFormState);

  const getSelectielijstklasseValue = (
    selectielijstklasseChoice: string,
  ): string => {
    // The first time a zaak is selected, the label of the choice is passed.
    // When the user interacts with the dropdown, the value is passed.
    const selectedChoice = selectieLijstKlasseChoices.find((choice) =>
      [choice.label, choice.value].includes(selectielijstklasseChoice),
    ) as
      | (Option & { value: string; detail: { bewaartermijn: string } })
      | undefined;

    if (!selectedChoice) return "";

    return selectedChoice.value || "";
  };

  // Update the form state based on props.
  useEffect(() => {
    const newFormState: ProcessZaakFormState = {
      ...initialFormState,
      action: action || initialFormState.action,
      selectielijstklasse:
        getSelectielijstklasseValue(selectielijstklasse) ||
        initialFormState.selectielijstklasse,
      archiefactiedatum:
        archiefactiedatum || initialFormState.archiefactiedatum,
      comment: comment || initialFormState.comment,
    };

    setFormState(newFormState);
  }, [action, selectielijstklasse, archiefactiedatum, comment]);

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

  const getBewaartermijn = (selectielijstklasse: string) => {
    const selectedChoice = selectieLijstKlasseChoices.find(
      (choice) => choice.value === selectielijstklasse,
    ) as (Option & { detail?: { bewaartermijn: string | null } }) | undefined;

    return selectedChoice?.detail?.bewaartermijn;
  };

  /**
   * Returns the `FormField[]` to show in the modal after selecting a Zaak (when processing review).
   */
  const getFields = (_formState: typeof formState = formState) => {
    const bewaartermijn = getBewaartermijn(_formState.selectielijstklasse);

    const isSelectielijstklasseActive =
      formState.action === "change_selectielijstklasse";

    const isArchiefactiedatumActive = Boolean(
      getBewaartermijn(_formState.selectielijstklasse) &&
        formState.action === "change_archiefactiedatum",
    );

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
        value: _formState.action,
        type: "radio",
        options: [
          {
            label: LABEL_CHANGE_SELECTION_LIST_CLASS,
            value: "change_selectielijstklasse",
            selected: _formState.action === "change_selectielijstklasse",
          },
          bewaartermijn
            ? {
                label: LABEL_POSTPONE_DESTRUCTION,
                value: "change_archiefactiedatum",
                selected: _formState.action === "change_archiefactiedatum",
              }
            : null,
          {
            label: LABEL_KEEP,
            value: "keep",
            selected: _formState.action === "keep",
          },
        ].filter((v: Option | null): v is Option => Boolean(v)) as Option[],
      },

      {
        label: isSelectielijstklasseActive ? "Selectielijstklasse" : undefined,
        name: "selectielijstklasse",
        required: isSelectielijstklasseActive,
        type: isSelectielijstklasseActive ? undefined : "hidden",
        options: isSelectielijstklasseActive
          ? selectieLijstKlasseChoices
          : undefined,
        value: _formState.selectielijstklasse,
      },

      {
        label:
          isArchiefactiedatumActive ||
          (isSelectielijstklasseActive && bewaartermijn)
            ? "Archiefactiedatum"
            : undefined,
        name: "archiefactiedatum",
        required: isArchiefactiedatumActive,
        type:
          isArchiefactiedatumActive ||
          (isSelectielijstklasseActive && bewaartermijn)
            ? "date"
            : "hidden",
        value: _formState.archiefactiedatum,
      },
    ];

    // Fields shown when an action is selected (regardless of the action).
    const actionSelectedFields: FormField[] = [
      {
        label: "Reden",
        name: "comment",
        required: true,
        value: _formState.comment,
      },
    ];

    return [...baseFields, ...(_formState.action ? actionSelectedFields : [])];
  };

  const validate = (values: AttributeData) => {
    const action = values.action;
    /**
     * Updates the form state, and validates the form.
     * @param values
     */
    const archiefactiedatum = zaak?.archiefactiedatum as string;
    const bewaartermijn = getBewaartermijn(
      values.selectielijstklasse as string,
    );
    if (
      action === "change_selectielijstklasse" &&
      archiefactiedatum &&
      bewaartermijn
    ) {
      const isSelectielijstklasseChanged =
        values.selectielijstklasse !== selectielijstklasse;

      // If the selectielijstklasse is changed, and all fields are available, update the archive date based on the
      // selectielijstklasse.
      if (isSelectielijstklasseChanged) {
        const archiveDate = addDuration(archiefactiedatum, bewaartermijn);
        values.archiefactiedatum = formatDate(archiveDate, "iso");
      }
    }

    setFormState(values as typeof formState);
    const _fields = getFields(values as typeof formState);
    return validateForm(values, _fields);
  };

  /**
   * Gets called when the form is submitted.
   * @param _
   * @param data
   */
  const handleSubmit = (_: FormEvent, data: SerializedFormData) => {
    const { zaakUrl, action, selectielijstklasse, archiefactiedatum, comment } =
      data as ProcessZaakFormState;

    onSubmit(
      zaakUrl as string,
      action as ProcessReviewAction,
      selectielijstklasse,
      getBewaartermijn(selectielijstklasse) ? archiefactiedatum : undefined,
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
                <Form
                  autoComplete="off"
                  justify="stretch"
                  noValidate
                  fields={getFields()}
                  labelSubmit={`${zaak?.identificatie} muteren`}
                  validateOnChange={true}
                  validate={validate}
                  onSubmit={handleSubmit}
                  initialValues={initialFormState}
                />
              </Column>
            </Grid>
          </Body>
        </Modal>
      )}
    </>
  );
};
