import {
  AttributeData,
  AttributeTable,
  Body,
  ButtonProps,
  DataGrid,
  Form,
  Modal,
  Outline,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import React, { useState } from "react";
import { useLoaderData, useNavigation, useRevalidator } from "react-router-dom";
import { useAsync } from "react-use";

import { useSubmitAction } from "../../../../../hooks";
import {
  ReviewItemResponse,
  ReviewResponse,
} from "../../../../../lib/api/reviewResponse";
import { ZaakSelection } from "../../../../../lib/api/zaakSelection";
import {
  addToZaakSelection,
  removeFromZaakSelection,
} from "../../../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../../../types";
import { DataGridAction, useDataGridProps } from "../../../hooks";
import { UpdateDestructionListAction } from "../../DestructionListDetail.action";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { DestructionListProcessZaakReviewModal } from "../index";

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

export type ProcessReviewAction =
  | "change_selectielijstklasse"
  | "change_archiefactiedatum"
  | "keep";

/**
 * Show items of a destruction list review.
 * Allows processing feedback of the destruction list.
 */
export function DestructionListProcessReview() {
  const { state } = useNavigation();
  const submitAction = useSubmitAction();

  const {
    storageKey,
    destructionList,
    zaken,
    zaakSelection,
    review,
    reviewItems = [],
    selectieLijstKlasseChoicesMap,
  } = useLoaderData() as DestructionListDetailContext;
  const revalidator = useRevalidator();
  const [
    processZaakReviewSelectionDetailState,
    setProcessZaakReviewSelectionDetailState,
  ] = useState<ProcessZaakReviewSelectionDetail>();

  //
  // SHARED VARS
  //

  // An object of {url: string} items used to indicate (additional) selected zaken.
  const selectedUrls = zaakSelection.items
    .filter((i) => i.selected)
    .map((i) => ({ url: i.zaak as string }));

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
      await removeFromZaakSelection(storageKey, [zaak.url as string], true);

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
    await addToZaakSelection(
      storageKey,
      [zaakUrl],
      {
        action,
        selectielijstklasse,
        archiefactiedatum,
        comment,
      },
      true,
    );

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
    const actionData: UpdateDestructionListAction<ReviewResponse> = {
      type: "PROCESS_REVIEW",
      payload: {
        review: review?.pk as number,
        comment: data.comment as string,
        itemsResponses:
          reviewItems?.map<ReviewItemResponse>((ri) => {
            const detail = zaakSelection.items.find(
              (i) => i.zaak === ri.zaak.url,
            )?.detail as ProcessZaakReviewSelectionDetail;

            return {
              reviewItem: ri.pk,
              actionItem: detail.action === "keep" ? "keep" : "remove",
              actionZaak: {
                selectielijstklasse: detail.selectielijstklasse,
                archiefactiedatum: detail.archiefactiedatum,
              },
              comment: detail.comment,
            };
          }) || [],
      },
    };

    submitAction(actionData);
  };

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
  const processZaakReviewSelectionState =
    zaakSelection as ZaakSelection<ProcessZaakReviewSelectionDetail>;

  // The details possibly provided by the user after processing a review for a zaak.
  const processZaakReviewDetail = processZaakReviewSelectionState?.items.find(
    (i) => i.zaak === processZaakReviewModalState.zaak?.url,
  )?.detail;

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
    {
      count: reviewItems?.length || 0,
      next: null,
      previous: null,
      results: reviewItems?.map((ri) => ri.zaak) || [],
    },
    selectedUrls,
    processZaakReviewZaakActions,
  );

  // Update the selected zaken to session storage.
  useAsync(async () => {
    await addToZaakSelection(storageKey, zaken.results, undefined, true);
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
      <DestructionListProcessZaakReviewModal
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
        count={zaken.count}
        loading={state === "loading"}
        selectable={true}
        allowSelectAll={!reviewItems}
        selectionActions={processZaakReviewSelectionActions}
        showPaginator={false}
        // sort={isEditingState}
        title="Zaakdossiers"
        onSelect={handleProcessReviewZaakSelect}
      />
    </>
  );
}
