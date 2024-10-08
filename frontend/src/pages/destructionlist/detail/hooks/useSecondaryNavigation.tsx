import {
  AttributeData,
  Solid,
  ToolbarItem,
  useConfirm,
  usePrompt,
} from "@maykin-ui/admin-ui";
import React, { useMemo } from "react";
import { useLoaderData, useNavigation } from "react-router-dom";

import { ProcessingStatusBadge } from "../../../../components";
import { useSubmitAction } from "../../../../hooks";
import { DestructionList } from "../../../../lib/api/destructionLists";
import { ReviewItemResponse } from "../../../../lib/api/reviewResponse";
import {
  canMarkAsReadyToReview,
  canMarkListAsFinal,
  canTriggerDestruction,
} from "../../../../lib/auth/permissions";
import { getFilteredZaakSelection } from "../../../../lib/zaakSelection/zaakSelection";
import { useZaakSelection } from "../../hooks";
import {
  UpdateDestructionListAction,
  UpdateDestructionListProcessReviewAction,
} from "../DestructionListDetail.action";
import { DestructionListDetailContext } from "../DestructionListDetail.loader";
import { ProcessReviewAction } from "../components";
import { useFormDialog } from "./useFormDialog";

interface ProcessZaakReviewSelectionDetail {
  comment: string;
  action: ProcessReviewAction;
  selectielijstklasse: string;
  archiefactiedatum: string;
}

/**
 * Returns the items to show in the secondary navigation (top bar) and provides
 * the associated callbacks.
 */
export function useSecondaryNavigation(): ToolbarItem[] {
  const { state } = useNavigation();
  const {
    storageKey,
    destructionList,
    destructionListItems,
    user,
    archivists,
    review,
    reviewItems,
  } = useLoaderData() as DestructionListDetailContext;

  const confirm = useConfirm();
  const prompt = usePrompt();
  const formDialog = useFormDialog();

  const submitAction = useSubmitAction<UpdateDestructionListAction>();
  const [, , { selectionSize }] = useZaakSelection(storageKey, []);

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
   * Gets called when the destruction list feedback is submitted.
   */
  const handleProcessReviewSubmitList = async (comment: string) => {
    const zaakSelection = await getFilteredZaakSelection(storageKey);

    console.assert(
      reviewItems?.length &&
        reviewItems?.length === Object.keys(zaakSelection).length,
      "The amount of review items does not match the amount of selected zaken!",
    );

    const actionData: UpdateDestructionListProcessReviewAction = {
      type: "PROCESS_REVIEW",
      payload: {
        storageKey: storageKey,
        reviewResponse: {
          review: review?.pk as number,
          comment: comment as string,
          itemsResponses:
            reviewItems?.map<ReviewItemResponse>((ri) => {
              const detail = zaakSelection[ri.zaak.url || ""]
                ?.detail as ProcessZaakReviewSelectionDetail;

              return {
                reviewItem: ri.pk,
                actionItem: detail.action === "keep" ? "keep" : "remove",
                comment: detail.comment,
                actionZaakType:
                  detail.action === "keep"
                    ? undefined
                    : detail.action === "change_selectielijstklasse"
                      ? "selectielijstklasse_and_bewaartermijn"
                      : "bewaartermijn",
                actionZaak:
                  detail.action !== "keep"
                    ? {
                        selectielijstklasse:
                          detail.action === "change_selectielijstklasse"
                            ? detail.selectielijstklasse
                            : undefined,
                        archiefactiedatum: detail.archiefactiedatum,
                      }
                    : undefined,
              };
            }) || [],
        },
      },
    };

    submitAction(actionData);
  };

  /**
   * Dispatches action to mark the destruction list as final (archivist approves).
   * @param assigneeId
   * @param comment
   */
  const handleMakeFinal = async (assigneeId: number, comment: string) => {
    submitAction({
      type: "MAKE_FINAL",
      payload: {
        uuid: destructionList.uuid,
        user: assigneeId,
        comment: comment,
      },
    });
  };

  const validateDestroy = ({ name }: AttributeData) => {
    // Name can be undefined at a certain point and will crash the entire page
    if (
      (name as string | undefined)?.toLowerCase() ===
      destructionList.name.toLowerCase()
    ) {
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

  /**
   * Dispatches action to cancel the destruction of all zaken on the destruction list.
   */
  const handleCancelDestroy = async (comment: string) => {
    submitAction({
      type: "CANCEL_DESTROY",
      payload: {
        uuid: destructionList.uuid,
        comment: comment,
      },
    });
  };

  /**
   * Returns whether `destructionList` is bound to be destroyed in the near future.
   */
  const isPlannedForDestruction = () => {
    return (
      destructionList.status === "ready_to_delete" &&
      !!destructionList.plannedDestructionDate &&
      destructionList.processingStatus === "new"
    );
  };

  return useMemo<ToolbarItem[]>(() => {
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
              pad: "h",
              onClick: () =>
                confirm(
                  "Ter beoordeling indienen",
                  "U staat op het punt om de lijst ter beoordeling in te dienen hierna kunt u geen zaken meer toevoegen en/of verwijderen van de vernietigingslijst",
                  "Ter beoordeling indienen",
                  "Annuleren",
                  handleReadyToReview,
                ),
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
                selectionSize !== destructionListItems.count,
              variant: "primary",
              pad: "h",
              onClick: () =>
                prompt(
                  `${destructionList.name} opnieuw indienen`,
                  undefined,
                  "Opmerking",
                  "Opnieuw indienen",
                  "Annuleren",
                  handleProcessReviewSubmitList,
                ),
            },
          ];
        default:
          return [];
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
          pad: "h",
          onClick: () =>
            formDialog(
              "Markeer als definitief",
              undefined,
              [
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
              ],
              "Markeer als definitief",
              "Annuleren",
              ({ assigneeIds, comment }) =>
                handleMakeFinal(Number(assigneeIds), String(comment)),
              undefined,
              undefined,
              {
                role: "form",
                validateOnChange: true,
              },
            ),
        },
      ];
    }

    if (canTriggerDestruction(user, destructionList)) {
      if (!isPlannedForDestruction()) {
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
              variant: "danger",
              pad: "h",
              onClick: () =>
                formDialog(
                  "Zaken definitief vernietigen",
                  `U staat op het punt om ${destructionListItems.count} zaken definitief te vernietigen`,
                  [
                    {
                      label: "Type naam van de lijst ter bevestiging",
                      name: "name",
                      placeholder: "Naam van de vernietigingslijst",
                      required: true,
                    },
                  ],
                  `${destructionListItems.count} zaken vernietigen`,
                  "Annuleren",
                  handleDestroy,
                  undefined,
                  undefined,
                  {
                    buttonProps: {
                      variant: "danger",
                    },
                    validate: validateDestroy,
                    validateOnChange: true,
                    role: "form",
                  },
                ),
            }
          ) : (
            <></>
          ),
        ];
      }
    }

    if (isPlannedForDestruction()) {
      return [
        {
          bold: true,
          children: (
            <>
              <Solid.XMarkIcon />
              Vernietigen annuleren
            </>
          ),
          variant: "danger",
          pad: "h",
          onClick: () =>
            prompt(
              "Vernietiging annuleren",
              `U staat op het punt om de vernietiging van ${destructionListItems.count} zaken vernietigen`,
              "Opmerking",
              "Vernietiging annuleren",
              "Annuleren",
              handleCancelDestroy,
            ),
        },
      ];
    }

    return [];
  }, [user, destructionList, selectionSize]);
}
