import {
  AttributeData,
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
  addToZaakSelection,
  getZaakSelection,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { useDataGridProps } from "../hooks";
import "./DestructionListDetail.css";
import { DestructionListDetailContext } from "./types";

/**
 * The interface for the zaken modal state
 */
interface ZaakModalDataState {
  open: boolean;
  zaak?: Zaak;
}

/**
 * This components displays the interface for zaken in the destruction list detail view and handles multiple scenario's:
 *
 * - Adding/removing destruction list items when no review is received.
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

  /* State to manage the state of the zaak modal (when clicking a checkbox) */
  const [zaakModalDataState, setZaakModalDataState] =
    useState<ZaakModalDataState>({
      open: false,
    });

  // Whether the user is adding/removing items from the destruction list.
  const isEditingState = !review && Boolean(urlSearchParams.get("is_editing"));
  // Whether the user is processing a review.
  const isProcessingReviewState = Boolean(reviewItems);

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
      : isProcessingReviewState
        ? selectedUrls
        : [],
  );

  // Update the selected zaken to session storage.
  useAsync(async () => {
    await addToZaakSelection(storageKey, zaken.results);
  }, []);

  /**
   * Gets called when the user updates the zaak selection (adds/remove zaken to/from the destruction list).
   */
  const handleUpdate = async () => {
    const zaakSelection = await getZaakSelection(storageKey);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selection]) => selection.selected)
      .map(([url]) => url);

    const formData = new FormData();
    zaakUrls.forEach((url) => formData.append("zaakUrls", url));

    submit(formData, { method: "PATCH" });
  };

  /**
   * Gets called when the user clicks the edit button (user intents to adds/remove zaken to/from the destruction list
   * or escape such flow).
   * @param value
   */
  const handleSetEditing = (value: boolean) => {
    urlSearchParams.set("page", "1");
    value
      ? urlSearchParams.set("is_editing", "true")
      : urlSearchParams.delete("is_editing");
    setUrlSearchParams(urlSearchParams);
  };

  /**
   * Get called when the user selects a zaak when a review is received.
   */
  const handleReviewZaakSelect = (data: AttributeData[], selected: boolean) => {
    const zaak = data[0] as unknown as Zaak;
    // Remove from selection.
    //
    // Remove the zaak from the selection in the background.
    if (!selected) {
      removeFromZaakSelection(storageKey, [zaak.url as string]);
      return;
    }

    // Open the modal
    //
    // The modal allow the user to provide feedback and submit it after which
    // `handleProcessReviewSubmit` is called.
    setZaakModalDataState({ open: true, zaak: zaak });
  };

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

    // Call the Route's loader function
    //
    // Because the selection is obtained from the loader, and no URL alterations
    // are made: we need to manually re-call the loader to obtain the updated
    // selection.
    revalidator.revalidate();
    setZaakModalDataState({
      open: false,
    });
  };

  return (
    <>
      <ProcessZaakReviewModal
        zaakModalDataState={zaakModalDataState}
        reviewItem={
          reviewItems?.find(
            (ri) => ri.zaak.url === zaakModalDataState.zaak?.url,
          ) || null
        }
        selectieLijstKlasseChoices={
          selectieLijstKlasseChoicesMap?.[zaakModalDataState.zaak?.url || ""] ||
          []
        }
        onSubmit={handleProcessReviewSubmit}
      />
      <DataGrid
        {...dataGridProps}
        boolProps={{ explicit: true }}
        count={isEditingState ? selectableZaken.count : zaken.count}
        filterable={isEditingState}
        loading={state === "loading"}
        selectable={Boolean(isEditingState || isProcessingReviewState)}
        allowSelectAll={!reviewItems}
        selectionActions={
          review
            ? undefined
            : isEditingState
              ? [
                  {
                    children: "Vernietigingslijst aanpassen",
                    onClick: handleUpdate,
                    wrap: false,
                  },
                  {
                    children: "Annuleren",
                    onClick: () => handleSetEditing(false),
                    wrap: false,
                  },
                ]
              : [
                  {
                    "aria-label": "bewerken",
                    children: <Outline.PencilIcon />,
                    onClick: () => handleSetEditing(true),
                    wrap: false,
                  },
                ]
        }
        showPaginator={!isProcessingReviewState}
        sort={isEditingState}
        title="Zaakdossiers"
        onSelect={
          isProcessingReviewState
            ? handleReviewZaakSelect
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
  onSubmit,
}) => {
  const initialFormState = {
    zaakUrl: zaak?.url,
    actie: "",
    selectielijstklasse: "",
    archief_datum: "",
    reden: "",
  };

  const [formState, setFormState] = useState<{
    actie: string;
    selectielijstklasse: string;
    archief_datum: string;
    reden: string;
  }>(initialFormState);

  useEffect(() => {
    setFormState(initialFormState);
  }, [zaak]);

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
  const getFields = () => {
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
        name: "actie",
        required: true,
        value: formState.actie,
        options: [
          {
            label: "Aanpassen van selectielijstklasse",
            value: "change_selectielijstklasse",
          },
          {
            label: "Verlengen bewaartermijn",
            value: "change_archiefactiedatum",
          },
          {
            label: "Afwijzen van het voorstel (terug op de vernietigingslijst)",
            value: "keep",
          },
        ],
      },
    ];

    // Fields shown when an action is selected (regardless of the action).
    const actionSelectedFields: FormField[] = [
      {
        label: "Reden",
        name: "reden",
        required: true,
      },
    ];

    // Fields shown when action is to change the "selectielijstklasse".
    const changeSelectielijstKlasseFields: FormField[] = [
      {
        label: "Selectielijstklasse",
        name: "selectielijstklasse",
        required: true,
        options: selectieLijstKlasseChoices,
      },
    ];

    // Fields shown when action is to change the "archiefactiedatum".
    const changeArchiefActieDatumFields: FormField[] = [
      {
        label: "Archief datum",
        name: "archief_datum",
        required: true,
        type: "date",
      },
    ];

    return [
      ...baseFields,
      ...(formState.actie === "change_selectielijstklasse"
        ? changeSelectielijstKlasseFields
        : formState.actie === "change_archiefactiedatum"
          ? changeArchiefActieDatumFields
          : []),
      ...(formState.actie ? actionSelectedFields : []),
    ];
  };

  /**
   * Gets called when the form is submitted.
   * @param _
   * @param zaakUrl
   * @param actie
   * @param selectielijstklasse
   * @param acrhief_datum
   * @param reden
   */
  const handleSubmit = (
    _: FormEvent,
    {
      zaakUrl,
      actie,
      selectielijstklasse,
      acrhief_datum,
      reden,
    }: SerializedFormData,
  ) => {
    const processAction = actie as ProcessAction;

    const processActionValue =
      processAction === "change_selectielijstklasse"
        ? (selectielijstklasse as string)
        : processAction === "change_archiefactiedatum"
          ? (acrhief_datum as string)
          : null;

    onSubmit(
      zaakUrl as string,
      processAction,
      processActionValue,
      reden as string,
    );
  };

  return (
    <Modal allowClose={false} open={open} size="m" title={zaak?.identificatie}>
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
              fields={getFields()}
              labelSubmit="Opslaan"
              validateOnChange={true}
              validate={(values) => setFormState(values as typeof formState)}
              onSubmit={handleSubmit}
            />
          </Column>
        </Grid>
      </Body>
    </Modal>
  );
};
