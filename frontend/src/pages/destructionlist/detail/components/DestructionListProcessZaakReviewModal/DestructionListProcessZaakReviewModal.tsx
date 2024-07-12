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

import { ReviewItem } from "../../../../../lib/api/review";
import { Zaak } from "../../../../../types";
import { ProcessReviewAction } from "../DestructionListProcessReview/DestructionListProcessReview";

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
    archiefactiedatum: string,
    comment: string,
  ) => void;
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
  type ProcessZaakFormState = {
    zaakUrl: string;
    action: ProcessReviewAction | "";
    selectielijstklasse: string;
    archiefactiedatum: string;
    comment: string;
  };

  // Initial form state.
  const initialFormState: ProcessZaakFormState = {
    zaakUrl: zaak?.url || "",
    action: "",
    selectielijstklasse: "",
    archiefactiedatum: "",
    comment: "",
  };

  // Form state, kept outside <Form/> to implement conditional fields (see `getFields()`).
  const [formState, setFormState] =
    useState<ProcessZaakFormState>(initialFormState);

  // Update the form state based on props.
  useEffect(() => {
    const newFormState: ProcessZaakFormState = {
      ...initialFormState,
      action: action || initialFormState.action,
      selectielijstklasse:
        selectielijstklasse || initialFormState.selectielijstklasse,
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

  /**
   * Returns the `FormField[]` to show in the modal after selecting a Zaak (when processing review).
   */
  const getFields = (_formState: typeof formState = formState) => {
    const isSelectielijstklasseActive =
      formState.action === "change_selectielijstklasse" ||
      !formState.selectielijstklasse;

    const isArchiefactiedatumActive =
      formState.action === "change_archiefactiedatum" ||
      !formState.archiefactiedatum;

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
          },
          {
            label: LABEL_POSTPONE_DESTRUCTION,
            value: "change_archiefactiedatum",
          },
          {
            label: LABEL_KEEP,
            value: "keep",
          },
        ],
      },

      {
        label: isSelectielijstklasseActive ? "Selectielijstklasse" : undefined,
        name: "selectielijstklasse",
        required: true,
        type: isSelectielijstklasseActive ? undefined : "hidden",
        options: isSelectielijstklasseActive
          ? selectieLijstKlasseChoices
          : undefined,
        value: _formState.selectielijstklasse,
      },

      {
        label: isArchiefactiedatumActive ? "Archief datum" : undefined,
        name: "archiefactiedatum",
        required: true,
        type: isArchiefactiedatumActive ? "date" : "hidden",
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

  /**
   * Updates the form state, and validates the form.
   * @param values
   */
  const validate = (values: AttributeData) => {
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
      archiefactiedatum,
      comment,
    );
  };

  return (
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
              noValidate
              fields={getFields()}
              labelSubmit={`${zaak?.identificatie} muteren`}
              validateOnChange={true}
              validate={validate}
              onSubmit={handleSubmit}
            />
          </Column>
        </Grid>
      </Body>
    </Modal>
  );
};
