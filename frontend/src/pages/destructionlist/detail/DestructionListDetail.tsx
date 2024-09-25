import {
  AttributeData,
  Body,
  Button,
  CardBaseTemplate,
  ErrorMessage,
  Form,
  FormField,
  Modal,
  P,
  SerializedFormData,
  Solid,
  Toolbar,
  ToolbarItem,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useState } from "react";
import { useLoaderData, useNavigation } from "react-router-dom";

import { ProcessingStatusBadge } from "../../../components/ProcessingStatusBadge";
import { useSubmitAction } from "../../../hooks";
import { ReviewItemResponse } from "../../../lib/api/reviewResponse";
import {
  canMarkAsReadyToReview,
  canMarkListAsFinal,
  canTriggerDestruction,
} from "../../../lib/auth/permissions";
import {
  UpdateDestructionListAction,
  UpdateDestructionListProcessReviewAction,
} from "./DestructionListDetail.action";
import { DestructionListDetailContext } from "./DestructionListDetail.loader";
import { DestructionListEdit } from "./components/DestructionListEdit/DestructionListEdit";
import {
  DestructionListProcessReview,
  ProcessReviewAction,
} from "./components/DestructionListProcessReview/DestructionListProcessReview";
import { DestructionListToolbar } from "./components/DestructionListToolbar/DestructionListToolbar";

interface ProcessZaakReviewSelectionDetail {
  comment: string;
  action: ProcessReviewAction;
  selectielijstklasse: string;
  archiefactiedatum: string;
}

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { state } = useNavigation();
  const {
    storageKey,
    archivists,
    destructionList,
    destructionListItems,
    review,
    reviewItems,
    user,
    zaakSelection,
  } = useLoaderData() as DestructionListDetailContext;
  const submitAction = useSubmitAction<UpdateDestructionListAction>();

  const [archivistModalOpenState, setArchivistModalOpenState] = useState(false);

  const [readyToReviewModalOpenState, setReadyToReviewModalOpenState] =
    useState(false);

  // State to manage the state of the comment modal (when submitting review feedback).
  const [
    processZaakReviewCommentModalOpenState,
    setProcessZaakReviewCommentModalOpenState,
  ] = useState(false);

  const [destroyModalOpenState, setDestroyModalOpenState] = useState(false);
  const isInReview = destructionList.status === "changes_requested";

  // An object of {url: string} items used to indicate (additional) selected zaken.
  const selectedUrls = Object.entries(zaakSelection)
    .filter(([, { selected }]) => selected)
    .map(([url]) => ({ url }));

  // The approval form for the archivist.
  const archivistModalFormFields: FormField[] = [
    {
      label: "Archivaris",
      name: "assigneeIds",
      options: archivists.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
    {
      label: "Comment",
      name: "comment",
      required: true,
    },
  ];

  // The destroy form for the record manager.
  const destroyModalFormFields: FormField[] = [
    {
      autoFocus: destroyModalOpenState,
      label: "Type naam van de lijst ter bevestiging",
      name: "name",
      placeholder: "Naam van de vernietigingslijst",
      required: true,
    },
  ];

  /**
   * Returns the items to show in the secondary navigation (top bar).
   */
  const getSecondaryNavigationItems = (): ToolbarItem[] | undefined => {
    if (canMarkAsReadyToReview(user, destructionList)) {
      switch (destructionList.status) {
        case "new":
          return [
            {
              children: (
                <>
                  <Solid.DocumentArrowUpIcon />
                  Ter beoordeling indienen
                </>
              ),
              onClick: () => setReadyToReviewModalOpenState(true),
              pad: "h",
            },
          ];
        case "changes_requested":
          return [
            {
              children: (
                <>
                  <Solid.DocumentArrowUpIcon />
                  Opnieuw indienen
                </>
              ),
              disabled:
                ["loading", "submitting"].includes(state) ||
                selectedUrls.length !== destructionListItems.count,
              variant: "primary",
              pad: "h",
              onClick: handleProcessReviewClick,
            },
          ];
      }
    }
    if (canMarkListAsFinal(user, destructionList)) {
      return [
        {
          children: (
            <>
              <Solid.KeyIcon />
              Markeren als definitief
            </>
          ),
          onClick: () => setArchivistModalOpenState(true),
          pad: "h",
        },
      ];
    }
    if (canTriggerDestruction(user, destructionList)) {
      return [
        destructionList.processingStatus === "new" ? (
          <></>
        ) : (
          <ProcessingStatusBadge
            key={destructionList.pk}
            processingStatus={destructionList.processingStatus}
          />
        ),
        "spacer",

        hasDestructionListItemsDateInFuture() ? (
          <ErrorMessage>
            Eén of meer zaken hebben een toekomstige archiefdatum.
          </ErrorMessage>
        ) : (
          <></>
        ),
        ["new", "failed"].includes(destructionList.processingStatus) ? (
          {
            bold: true,
            children: (
              <>
                <Solid.TrashIcon />
                {destructionList.processingStatus === "new"
                  ? "Vernietigen starten"
                  : "Vernietigen herstarten"}
              </>
            ),
            disabled: hasDestructionListItemsDateInFuture(),
            pad: "h",
            variant: "danger",
            onClick: () => setDestroyModalOpenState(true),
          }
        ) : (
          <></>
        ),
      ];
    }
  };

  const hasDestructionListItemsDateInFuture = () => {
    return destructionListItems.results.some((item) => {
      if (item.zaak && item.zaak.archiefactiedatum) {
        return item.zaak.archiefactiedatum > new Date().toISOString();
      }
      return false;
    });
  };

  /**
   * Dispatches action to mark the destruction list as final (archivist approves).
   */
  const handleReadyToReview = async () => {
    submitAction({
      type: "READY_TO_REVIEW",
      payload: {
        uuid: destructionList.uuid,
      },
    });
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
    const actionData: UpdateDestructionListProcessReviewAction = {
      type: "PROCESS_REVIEW",
      payload: {
        storageKey: storageKey,
        reviewResponse: {
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
                comment: detail.comment,
              };
            }) || [],
        },
      },
    };

    submitAction(actionData);
  };

  /**
   * Dispatches action to mark the destruction list as final (archivist approves).
   * @param _
   * @param data
   */
  const handleMakeFinal = async (_: FormEvent, data: SerializedFormData) => {
    submitAction({
      type: "MAKE_FINAL",
      payload: {
        uuid: destructionList.uuid,
        user: Number(data.assigneeIds),
        comment: data.comment as string,
      },
    });
  };

  const validateDestroy = ({ name }: AttributeData) => {
    if (name === destructionList.name) {
      return;
    }
    return {
      name: "De opgegeven naam komt niet overeen met de naam van de lijst! Controleer de naam van de lijst en probeer het opnieuw.",
    };
  };

  /**
   * Dispatches action to DESTROY ALL ZAKEN ON THE DESTRUCTION LIST!
   */
  const handleDestroy = async () => {
    submitAction({
      type: "DESTROY",
      payload: {
        uuid: destructionList.uuid,
      },
    });
  };

  return (
    <CardBaseTemplate secondaryNavigationItems={getSecondaryNavigationItems()}>
      <DestructionListToolbar />
      {isInReview ? <DestructionListProcessReview /> : <DestructionListEdit />}

      {destructionList.status === "new" && (
        <Modal
          title="Ter beoordeling indienen"
          open={readyToReviewModalOpenState}
          size="m"
          onClose={() => setReadyToReviewModalOpenState(false)}
        >
          <Body>
            <P>
              U staat op het punt om de lijst ter beoordeling in te dienen,
              hierna kunt u geen zaken meer toevoegen en/of verwijderen van de
              vernietigingslijst.
            </P>
            <Toolbar align="end">
              <Button variant="primary" onClick={handleReadyToReview}>
                Ter beoordeling indienen
              </Button>
            </Toolbar>
          </Body>
        </Modal>
      )}

      {destructionList.status === "changes_requested" && (
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
      )}

      {destructionList.status === "internally_reviewed" && (
        <Modal
          title="Markeer als definitief"
          open={archivistModalOpenState}
          size="m"
          onClose={() => setArchivistModalOpenState(false)}
        >
          <Body>
            <Form
              fields={archivistModalFormFields}
              labelSubmit="Markeer als definitief"
              role="form"
              validateOnChange={true}
              onSubmit={handleMakeFinal}
            />
          </Body>
        </Modal>
      )}

      {destructionList.status === "ready_to_delete" && (
        <Modal
          title="Zaken definitief vernietigen"
          open={destroyModalOpenState}
          size="m"
          onClose={() => setDestroyModalOpenState(false)}
        >
          <Body>
            <P>
              U staat op het punt om {destructionListItems.count} zaken
              definitief te vernietigen.
            </P>
          </Body>
          <Body>
            <Form
              buttonProps={{
                variant: "danger",
              }}
              fields={destroyModalFormFields}
              labelSubmit={`${destructionListItems.count} zaken vernietigen`}
              validate={validateDestroy}
              validateOnChange={true}
              role="form"
              onSubmit={handleDestroy}
            />
          </Body>
        </Modal>
      )}
    </CardBaseTemplate>
  );
}
