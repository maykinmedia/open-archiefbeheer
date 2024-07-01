import {
  AttributeData,
  AttributeTable,
  Body,
  Column,
  DataGrid,
  ErrorMessage,
  Form,
  FormField,
  Grid,
  H3,
  Hr,
  Modal,
  Option,
  Outline,
  P,
  SerializedFormData,
  validateForm,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useEffect, useState } from "react";
import {
  useLoaderData,
  useNavigation,
  useRevalidator,
  useSearchParams,
  useSubmit,
} from "react-router-dom";
import { useAsync } from "react-use";

import { ReviewItem } from "../../../lib/api/review";
import {
  ZaakSelection,
  addToZaakSelection,
  getZaakSelection,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { DataGridAction, useDataGridProps } from "../hooks";
import "./DestructionListDetail.css";
import { DestructionListDetailContext } from "./types";

/**
 * The interface for the zaken modal state
 */
interface ZaakModalDataState {
  open: boolean;
  zaak?: Zaak;
}

const LABEL_CHANGE_SELECTION_LIST_CLASS = "Aanpassen van selectielijstklasse";
const LABEL_POSTPONE_DESTRUCTION = "Verlengen bewaartermijn";
const LABEL_KEEP = "Afwijzen van het voorstel (terug op de vernietigingslijst)";

interface ProcessZaakReviewSelectionDetail {
  comment: string;
  processAction: ProcessAction;
  processActionValue:
    | typeof LABEL_CHANGE_SELECTION_LIST_CLASS
    | typeof LABEL_POSTPONE_DESTRUCTION
    | typeof LABEL_KEEP
    | string
    | null;
}

/**
 * This component displays the interface for zaken in the destruction list detail view and handles multiple scenario's:
 *
 * - Adding/removing destruction list items when no review is received (possibly not support due to status flow).
 * - Updating items on the destruction list if review is received.
 */
export function DestructionListItems() {
  const { state } = useNavigation();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const submit = useSubmit();
  const {
    storageKey,
    zaken,
    selectableZaken,
    zaakSelection,
    review,
    reviewItems,
    selectieLijstKlasseChoicesMap,
  } = useLoaderData() as DestructionListDetailContext;
  const revalidator = useRevalidator();
  const [
    processZaakReviewSelectionDetailState,
    setProcessZaakReviewSelectionDetailState,
  ] = useState<ProcessZaakReviewSelectionDetail>();

  // Whether the user is adding/removing items from the destruction list.
  const isEditingState = !review && Boolean(urlSearchParams.get("is_editing"));

  //
  // EDITING VARS
  //

  /**
   * Gets called when the user clicks the edit button (user intents to adds/remove zaken to/from the destruction list
   * or escape such flow).
   * @param value
   */
  const handleEditSetEditing = (value: boolean) => {
    urlSearchParams.set("page", "1");
    value
      ? urlSearchParams.set("is_editing", "true")
      : urlSearchParams.delete("is_editing");
    setUrlSearchParams(urlSearchParams);
  };

  /**
   * Gets called when the user updates the zaak selection (adds/remove zaken to/from the destruction list).
   */
  const handleEditUpdate = async () => {
    const zaakSelection = await getZaakSelection(storageKey);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selection]) => selection.selected)
      .map(([url]) => url);

    const formData = new FormData();
    zaakUrls.forEach((url) => formData.append("zaakUrls", url));

    submit(formData, { method: "PATCH" });
  };

  // Selection actions allowing the user to add/remove zaken to/from the destruction list or escape such flow.
  const editSelectionActions = isEditingState
    ? [
        {
          children: "Vernietigingslijst aanpassen",
          onClick: handleEditUpdate,
          wrap: false,
        },
        {
          children: "Annuleren",
          onClick: () => handleEditSetEditing(false),
          wrap: false,
        },
      ]
    : [
        {
          "aria-label": "bewerken",
          children: <Outline.PencilIcon />,
          onClick: () => handleEditSetEditing(true),
          wrap: false,
        },
      ];

  //
  // PROCESSING REVIEW VARS
  //

  /**
   * Get called when the user selects a zaak when a review is received.
   */
  const handleProcessReviewZaakSelect = async (
    data: AttributeData[],
    selected: boolean,
  ) => {
    const zaak = data[0] as unknown as Zaak;
    // Remove from selection.
    //
    // Remove the zaak from the selection in the background.
    if (!selected) {
      await removeFromZaakSelection(storageKey, [zaak.url as string]);

      // Call the Route's loader function
      //
      // Because the selection is obtained from the loader, and no URL alterations
      // are made: we need to manually re-call the loader to obtain the updated
      // selection.
      revalidator.revalidate();
      return;
    }

    // Open the modal
    //
    // The modal allow the user to provide feedback and submit it after which
    // `handleProcessReviewSubmit` is called.
    setProcessZaakReviewModalState({ open: true, zaak: zaak });
  };

  const handleProcessReviewClose = () =>
    setProcessZaakReviewModalState({ open: false });

  /**
   * Gets called when the user submits review feedback.
   * Stores the provided feedback along with the `ZaakSelection`.
   * @param zaakUrl
   * @param processAction
   * @param processActionValue
   * @param comment
   */
  const handleProcessReviewSubmit = async (
    zaakUrl: string,
    processAction: ProcessAction,
    processActionValue: string | null,
    comment: string,
  ) => {
    // Add `zaak` to `ZaakSelection`
    //
    // We add the selected zaak to the zaak selection and add our feedback as
    // details, this allows us to recover (and submit) the feedback later.
    await addToZaakSelection(storageKey, [zaakUrl], {
      processAction,
      processActionValue,
      comment,
    });

    setProcessZaakReviewModalState({
      open: false,
    });

    // Call the Route's loader function
    //
    // Because the selection is obtained from the loader, and no URL alterations
    // are made: we need to manually re-call the loader to obtain the updated
    // selection.
    revalidator.revalidate();
  };

  // Whether the user is processing a review.
  const isProcessingZaakReviewState = Boolean(reviewItems);

  // State to manage the state of the zaak modal (when clicking a checkbox)
  const [processZaakReviewModalState, setProcessZaakReviewModalState] =
    useState<ZaakModalDataState>({
      open: false,
    });

  // The zaak selection typed correctly for use when providing feedback on a review.
  const processZaakReviewSelectionState = isProcessingZaakReviewState
    ? (zaakSelection as ZaakSelection<ProcessZaakReviewSelectionDetail>)
    : undefined;

  // The details possibly provided by the user after processing a review for a zaak.
  const processZaakReviewDetail =
    processZaakReviewSelectionState?.[
      processZaakReviewModalState.zaak?.url || ""
    ]?.detail;

  const processZaakReviewZaakActions: DataGridAction[] = [
    {
      children: <Outline.ChatBubbleLeftRightIcon />,
      title: "Muteren",
      tooltip:
        (processZaakReviewSelectionDetailState?.processAction ===
          "change_selectielijstklasse" && (
          <AttributeTable
            object={{
              Actie: LABEL_CHANGE_SELECTION_LIST_CLASS,
              Selectielijst: Object.values(selectieLijstKlasseChoicesMap || {})
                .flatMap((v) => v)
                .find(
                  (o) =>
                    o.value ===
                    processZaakReviewSelectionDetailState.processActionValue,
                )?.label,
              Reden: processZaakReviewSelectionDetailState.comment,
            }}
          />
        )) ||
        (processZaakReviewSelectionDetailState?.processAction ===
          "change_archiefactiedatum" && (
          <AttributeTable
            object={{
              Actie: LABEL_POSTPONE_DESTRUCTION,
              Archief_datum:
                processZaakReviewSelectionDetailState.processActionValue,
              Reden: processZaakReviewSelectionDetailState.comment,
            }}
          />
        )) ||
        (processZaakReviewSelectionDetailState?.processAction === "keep" && (
          <AttributeTable
            object={{
              Actie: LABEL_KEEP,
              Reden: processZaakReviewSelectionDetailState.comment,
            }}
          />
        )),
      onInteract: (_, detail) => {
        setProcessZaakReviewSelectionDetailState(
          detail as ProcessZaakReviewSelectionDetail,
        );
      },
      onClick: (zaak) => {
        handleProcessReviewZaakSelect(
          [zaak] as unknown as AttributeData[],
          true,
        );
      },
    },
  ];

  //
  // SHARED VARS
  //

  // An object of {url: string} items used to indicate (additional) selected zaken.
  const selectedUrls = Object.entries(zaakSelection)
    .filter(([_, { selected }]) => selected)
    .map(([url]) => ({ url }));

  // Get the base props for the DataGrid component.
  const { props: dataGridProps } = useDataGridProps(
    storageKey,
    reviewItems
      ? // FIXME: Accept no/implement real pagination?
        {
          count: reviewItems.length,
          next: null,
          previous: null,
          results: reviewItems.map((ri) => ri.zaak),
        }
      : isEditingState
        ? selectableZaken
        : zaken,
    isEditingState
      ? [...zaken.results, ...selectedUrls]
      : isProcessingZaakReviewState
        ? selectedUrls
        : [],
    isProcessingZaakReviewState ? processZaakReviewZaakActions : undefined,
  );

  // Update the selected zaken to session storage.
  useAsync(async () => {
    await addToZaakSelection(storageKey, zaken.results);
  }, []);

  return (
    <>
      <ProcessZaakReviewModal
        zaakModalDataState={processZaakReviewModalState}
        reviewItem={
          reviewItems?.find(
            (ri) => ri.zaak.url === processZaakReviewModalState.zaak?.url,
          ) || null
        }
        selectieLijstKlasseChoices={
          selectieLijstKlasseChoicesMap?.[
            processZaakReviewModalState.zaak?.url || ""
          ] || []
        }
        processAction={processZaakReviewDetail?.processAction}
        processActionValue={processZaakReviewDetail?.processActionValue}
        comment={processZaakReviewDetail?.comment}
        onClose={handleProcessReviewClose}
        onSubmit={handleProcessReviewSubmit}
      />
      <DataGrid
        {...dataGridProps}
        boolProps={{ explicit: true }}
        count={isEditingState ? selectableZaken.count : zaken.count}
        filterable={isEditingState}
        loading={state === "loading"}
        selectable={Boolean(isEditingState || isProcessingZaakReviewState)}
        allowSelectAll={!reviewItems}
        selectionActions={review ? undefined : editSelectionActions}
        showPaginator={!isProcessingZaakReviewState}
        sort={isEditingState}
        title="Zaakdossiers"
        onSelect={
          isProcessingZaakReviewState
            ? handleProcessReviewZaakSelect
            : dataGridProps.onSelect
        }
      />
    </>
  );
}

type ProcessZaakReviewModalProps = {
  zaakModalDataState: ZaakModalDataState;
  reviewItem: ReviewItem | null;
  selectieLijstKlasseChoices: Option[];
  processAction?: ProcessAction;
  processActionValue?: string | null;
  comment?: string;
  onClose: () => void;
  onSubmit: (
    zaakUrl: string,
    processAction: ProcessAction,
    processActionValue: string | null,
    comment: string,
  ) => void;
};

type ProcessAction =
  | "change_selectielijstklasse"
  | "change_archiefactiedatum"
  | "keep";

/**
 * A modal allowing the user to process (review) feedback of a zaak.
 * @param open
 * @param zaak
 * @param reviewItem
 * @param selectielijstklasseChoices
 */
const ProcessZaakReviewModal: React.FC<ProcessZaakReviewModalProps> = ({
  zaakModalDataState: { open, zaak },
  reviewItem,
  selectieLijstKlasseChoices,
  comment,
  processAction,
  processActionValue,
  onClose,
  onSubmit,
}) => {
  type ProcessZaakFormState = {
    zaakUrl: string;
    processAction: ProcessAction | "";
    selectielijstklasse: string;
    archief_datum: string;
    comment: string;
  };

  // Initial form state.
  const initialFormState: ProcessZaakFormState = {
    zaakUrl: zaak?.url || "",
    processAction: "",
    selectielijstklasse: "",
    archief_datum: "",
    comment: "",
  };

  // Form state, kept outside <Form/> to implement conditional fields (see `getFields()`).
  const [formState, setFormState] =
    useState<ProcessZaakFormState>(initialFormState);

  // Update the form state based on props.
  useEffect(() => {
    const newFormState: ProcessZaakFormState = {
      ...initialFormState,
      processAction: processAction || initialFormState.processAction,
      selectielijstklasse:
        processAction === "change_selectielijstklasse"
          ? processActionValue || ""
          : initialFormState.selectielijstklasse,
      archief_datum:
        processAction === "change_archiefactiedatum"
          ? processActionValue || ""
          : initialFormState.archief_datum,
      comment: comment || initialFormState.comment,
    };

    setFormState(newFormState);
  }, [comment, processAction, processActionValue, zaak]);

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
        name: "processAction",
        required: true,
        value: _formState.processAction,
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

    // Fields shown when action is to change the "selectielijstklasse".
    const changeSelectielijstKlasseFields: FormField[] = [
      {
        label: "Selectielijstklasse",
        name: "selectielijstklasse",
        required: true,
        options: selectieLijstKlasseChoices,
        value: _formState.selectielijstklasse,
      },
    ];

    // Fields shown when action is to change the "archiefactiedatum".
    const changeArchiefActieDatumFields: FormField[] = [
      {
        label: "Archief datum",
        name: "archief_datum",
        required: true,
        type: "date",
        value: _formState.archief_datum,
      },
    ];

    return [
      ...baseFields,
      ...(_formState.processAction === "change_selectielijstklasse"
        ? changeSelectielijstKlasseFields
        : _formState.processAction === "change_archiefactiedatum"
          ? changeArchiefActieDatumFields
          : []),
      ...(_formState.processAction ? actionSelectedFields : []),
    ];
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
    const {
      zaakUrl,
      processAction,
      selectielijstklasse,
      archief_datum,
      comment,
    } = data as ProcessZaakFormState;

    const processActionValue =
      processAction === "change_selectielijstklasse"
        ? (selectielijstklasse as string)
        : processAction === "change_archiefactiedatum"
          ? (archief_datum as string)
          : null;

    onSubmit(
      zaakUrl as string,
      processAction as ProcessAction,
      processActionValue,
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
