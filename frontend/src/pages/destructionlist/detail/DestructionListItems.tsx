import {
  AttributeData,
  AttributeTable,
  Body,
  ButtonProps,
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
import { ReviewItemResponse } from "../../../lib/api/reviewResponse";
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
const LABEL_KEEP = "Afwijzen van het voorstel";

interface ProcessZaakReviewSelectionDetail {
  comment: string;
  action: ProcessReviewAction;
  selectielijstklasse: string;
  archiefactiedatum: string;
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
    destructionList,
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
  // SHARED VARS
  //

  // An object of {url: string} items used to indicate (additional) selected zaken.
  const selectedUrls = Object.entries(zaakSelection)
    .filter(([_, { selected }]) => selected)
    .map(([url]) => ({ url }));

  //
  // EDITING MODE VARS
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
  const editSelectionActions: ButtonProps[] = isEditingState
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
          "aria-label": "Bewerken",
          children: <Outline.PencilIcon />,
          onClick: () => handleEditSetEditing(true),
          wrap: false,
        },
      ];

  //
  // PROCESSING REVIEW MODE VARS
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
   */
  const handleProcessReviewSubmitZaak = async (
    zaakUrl: string,
    action: ProcessReviewAction,
    selectielijstklasse: string,
    archiefactiedatum: string,
    comment: string,
  ) => {
    // Add `zaak` to `ZaakSelection`
    //
    // We add the selected zaak to the zaak selection and add our feedback as
    // details, this allows us to recover (and submit) the feedback later.
    await addToZaakSelection(storageKey, [zaakUrl], {
      action,
      selectielijstklasse,
      archiefactiedatum,
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

  /**
   * Gets called when the "Opnieuw indienen" button is clicked.
   */
  const handleProcessReviewClick = () => {
    setProcessZaakReviewCommentModalOpenState(true);
  };

  /**
   * Gets called when the destruction list feedback is submitted.
   */
  const handleProcessReviewSubmitList = (
    _: React.FormEvent,
    data: SerializedFormData,
  ) => {
    console.assert(
      reviewItems?.length && reviewItems?.length === selectedUrls.length,
      "The amount of review items does not match the amount of selected zaken!",
    );

    // Use JSON as `FormData` can't contain complex types.
    const actionData = {
      reviewResponseJSON: JSON.stringify({
        review: review?.pk as number,
        comment: data.comment as string,
        itemsResponses:
          reviewItems?.map<ReviewItemResponse>((ri) => {
            const detail = zaakSelection[ri.zaak.url || ""]
              .detail as ProcessZaakReviewSelectionDetail;

            return {
              reviewItem: ri.pk,
              actionItem: detail.action === "keep" ? "keep" : "remove",
              actionZaak: {
                selectielijstklasse: detail.selectielijstklasse,
                archiefactiedatum: detail.archiefactiedatum,
              },
              comment: "FIXME",
            };
          }) || [],
      }),
    };

    submit(actionData, { method: "POST" });
  };

  // Whether the user is processing a review.
  const isProcessingZaakReviewState = Boolean(reviewItems);

  // State to manage the state of the comment modal (when submitting review feedback).
  const [
    processZaakReviewCommentModalOpenState,
    setProcessZaakReviewCommentModalOpenState,
  ] = useState(false);

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

  const processZaakReviewSelectionActions: ButtonProps[] = [
    {
      children:
        selectedUrls.length !== zaken.count
          ? `Selecter ${zaken.count - selectedUrls.length} zaken`
          : "Opnieuw indienen",
      disabled: selectedUrls.length !== zaken.count,
      onClick: handleProcessReviewClick,
    },
  ];

  const processZaakReviewZaakActions: DataGridAction[] = [
    {
      children: <Outline.ChatBubbleLeftRightIcon />,
      title: "Muteren",
      tooltip:
        (processZaakReviewSelectionDetailState?.action ===
          "change_selectielijstklasse" && (
          <AttributeTable
            object={{
              Actie: LABEL_CHANGE_SELECTION_LIST_CLASS,
              Selectielijst: Object.values(selectieLijstKlasseChoicesMap || {})
                .flatMap((v) => v)
                .find(
                  (o) =>
                    o.value ===
                    processZaakReviewSelectionDetailState.selectielijstklasse,
                )?.label,
              Reden: processZaakReviewSelectionDetailState.comment,
            }}
            valign="start"
          />
        )) ||
        (processZaakReviewSelectionDetailState?.action ===
          "change_archiefactiedatum" && (
          <AttributeTable
            object={{
              Actie: LABEL_POSTPONE_DESTRUCTION,
              archiefactiedatum:
                processZaakReviewSelectionDetailState.archiefactiedatum,
              Reden: processZaakReviewSelectionDetailState.comment,
            }}
            valign="start"
          />
        )) ||
        (processZaakReviewSelectionDetailState?.action === "keep" && (
          <AttributeTable
            object={{
              Actie: LABEL_KEEP,
              Reden: processZaakReviewSelectionDetailState.comment,
            }}
            valign="start"
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
  // RENDERING
  //

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
      {/* The "comment" modal */}
      <Modal
        allowClose={true}
        open={processZaakReviewCommentModalOpenState}
        size="m"
        title={`${destructionList.name} opnieuw indienen`}
        onClose={() => setProcessZaakReviewCommentModalOpenState(false)}
      >
        <Body>
          <Form
            fields={[
              {
                label: "Opmerking",
                name: "comment",
              },
            ]}
            onSubmit={handleProcessReviewSubmitList}
            validateOnChange={true}
            labelSubmit={"Opnieuw indienen"}
          />
        </Body>
      </Modal>
      {/* The "feedback" modal */}
      <ProcessZaakReviewModal
        zaakModalDataState={processZaakReviewModalState}
        reviewItem={
          reviewItems?.find(
            (ri) => ri.zaak.url === processZaakReviewModalState.zaak?.url,
          ) || null
        }
        action={processZaakReviewDetail?.action}
        selectielijstklasse={
          processZaakReviewDetail?.selectielijstklasse ||
          processZaakReviewModalState.zaak?.selectielijstklasse ||
          ""
        }
        selectieLijstKlasseChoices={
          selectieLijstKlasseChoicesMap?.[
            processZaakReviewModalState.zaak?.url || ""
          ] || []
        }
        archiefactiedatum={
          processZaakReviewDetail?.archiefactiedatum ||
          processZaakReviewModalState.zaak?.archiefactiedatum ||
          ""
        }
        comment={processZaakReviewDetail?.comment}
        onClose={handleProcessReviewClose}
        onSubmit={handleProcessReviewSubmitZaak}
      />
      {/* DataGrid */}
      <DataGrid
        {...dataGridProps}
        boolProps={{ explicit: true }}
        count={isEditingState ? selectableZaken.count : zaken.count}
        filterable={isEditingState}
        loading={state === "loading"}
        selectable={Boolean(isEditingState || isProcessingZaakReviewState)}
        allowSelectAll={!reviewItems}
        selectionActions={
          review ? processZaakReviewSelectionActions : editSelectionActions
        }
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

type ProcessReviewAction =
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
