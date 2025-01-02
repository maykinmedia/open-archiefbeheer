import {
  Solid,
  ToolbarItem,
  useConfirm,
  useFormDialog,
  usePrompt,
} from "@maykin-ui/admin-ui";
import { useContext, useMemo } from "react";
import { useNavigation, useRouteLoaderData } from "react-router-dom";

import {
  DestructionListStatusBadge,
  ProcessingStatusBadge,
} from "../../../../components";
import { ZaakSelectionContext } from "../../../../contexts";
import { useSubmitAction } from "../../../../hooks";
import { ReviewItemResponse } from "../../../../lib/api/reviewResponse";
import {
  DestructionListPermissionCheck,
  canDeleteDestructionList,
  canMarkAsReadyToReview,
  canMarkListAsFinal,
  canTriggerDestruction,
} from "../../../../lib/auth/permissions";
import { formatUser } from "../../../../lib/format/user";
import { getFilteredZaakSelection } from "../../../../lib/zaakSelection";
import {
  UpdateDestructionListAction,
  UpdateDestructionListProcessReviewAction,
} from "../DestructionListDetail.action";
import { DestructionListDetailContext } from "../DestructionListDetail.loader";
import { ProcessReviewAction } from "../pages/DestructionListProcessReviewPage/components";

interface ProcessZaakReviewSelectionDetail {
  comment: string;
  action: ProcessReviewAction;
  selectielijstklasse: string;
  archiefactiedatum: string;
}

type MakeFinalFormType = {
  assigneeIds: string;
  comment: string;
};

type DestructionListNameFormType = {
  name: string;
};

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
  } = useRouteLoaderData(
    "destruction-list:detail",
  ) as DestructionListDetailContext;

  const confirm = useConfirm();
  const prompt = usePrompt();
  const formDialog = useFormDialog();

  const submitAction = useSubmitAction<UpdateDestructionListAction>();
  const { selectionSize } = useContext(ZaakSelectionContext);

  /**
   * Return `toolbarItem` if `permissionCheck(user, destructionList)` return true.
   * @param toolbarItem
   * @param permissionCheck
   */
  const getPermittedToolbarItem = (
    toolbarItem: ToolbarItem,
    permissionCheck: DestructionListPermissionCheck,
  ): ToolbarItem => {
    if (!permissionCheck(user, destructionList)) {
      return null;
    }
    return toolbarItem;
  };

  const BUTTON_DELETE_LIST: ToolbarItem = {
    children: (
      <>
        <Solid.DocumentMinusIcon />
        Lijst verwijderen
      </>
    ),
    pad: "h",
    variant: "danger",
    onClick: () =>
      formDialog<DestructionListNameFormType>(
        "Lijst verwijderen",
        `Dit verwijdert de lijst maar niet de zaken die erop staan. Weet u zeker dat u de lijst "${destructionList.name}" wilt verwijderen?`,
        [
          {
            label: "Type naam van de lijst ter bevestiging",
            name: "name",
            placeholder: "Naam van de vernietigingslijst",
            required: true,
          },
        ],
        `Lijst verwijderen`,
        "Annuleren",
        handleDeleteList,
        undefined,
        undefined,
        {
          buttonProps: {
            variant: "danger",
          },
          validate: validateName,
          validateOnChange: true,
          role: "form",
        },
      ),
  };

  /**
   * Dispatches action to DELETE THE DESTRUCTION LIST!
   */
  const handleDeleteList = async () => {
    submitAction({
      type: "DELETE_LIST",
      payload: {
        uuid: destructionList.uuid,
      },
    });
  };

  const BUTTON_READY_TO_REVIEW: ToolbarItem = {
    children: (
      <>
        <Solid.DocumentArrowUpIcon />
        Ter beoordeling indienen
      </>
    ),
    pad: "h",
    variant: "primary",
    onClick: () =>
      confirm(
        "Ter beoordeling indienen",
        "U staat op het punt om de lijst ter beoordeling in te dienen hierna kunt u geen zaken meer toevoegen en/of verwijderen van de vernietigingslijst",
        "Ter beoordeling indienen",
        "Annuleren",
        handleReadyToReview,
      ),
  };

  const BUTTON_ABORT_PROCESS: ToolbarItem = {
    children: (
      <>
        <Solid.DocumentArrowUpIcon />
        Proces afbreken
      </>
    ),
    pad: "h",
    variant: "warning",
    onClick: () =>
      prompt(
        "Proces afbreken",
        `U staat op het punt om vernietigingslijst terug te zetten naar de status "nieuw", de huidige beoordeling(en) worden afgebroken`,
        "Opmerking",
        "Proces afbreken",
        "Annuleren",
        handleCancelDestroy,
      ),
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

  const BUTTON_PROCESS_REVIEW: ToolbarItem = {
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
        handleProcessReview,
      ),
  };

  /**
   * Gets called when the destruction list feedback is submitted.
   */
  const handleProcessReview = async (comment: string) => {
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

  const BUTTON_MAKE_FINAL: ToolbarItem = {
    children: (
      <>
        <Solid.KeyIcon />
        Markeren als definitief
      </>
    ),
    pad: "h",
    onClick: () =>
      formDialog<MakeFinalFormType>(
        "Markeer als definitief",
        undefined,
        [
          {
            label: "Archivaris",
            name: "assigneeIds",
            options: archivists.map((user) => ({
              value: String(user.pk),
              label: formatUser(user),
            })),
            required: true,
          },
          {
            label: "Opmerking",
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

  const BUTTON_DESTROY: ToolbarItem = {
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
      formDialog<DestructionListNameFormType>(
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
        handleQueueDestruction,
        undefined,
        undefined,
        {
          buttonProps: {
            variant: "danger",
          },
          validate: validateName,
          validateOnChange: true,
          role: "form",
        },
      ),
  };

  const validateName = ({ name }: DestructionListNameFormType) => {
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
  const handleQueueDestruction = async () => {
    submitAction({
      type: "QUEUE_DESTRUCTION",
      payload: {
        uuid: destructionList.uuid,
      },
    });
  };

  const BUTTON_CANCEL_DESTROY: ToolbarItem = {
    bold: true,
    children: (
      <>
        <Solid.HandRaisedIcon />
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
    return [
      //
      // LEFT
      //

      <DestructionListStatusBadge
        key="status"
        destructionList={destructionList}
      />,

      // Status: "ready_to_delete": badge and spacer
      getPermittedToolbarItem(
        <ProcessingStatusBadge
          key={destructionList.pk}
          processingStatus={destructionList.processingStatus}
        />,
        (user, destructionList) =>
          canTriggerDestruction(user, destructionList) &&
          destructionList.processingStatus !== "new",
      ),

      "spacer",

      //
      // Right
      //

      // Status: "new": "Lijst verwijderen" and "Ter beoordeling indienen"
      getPermittedToolbarItem(BUTTON_DELETE_LIST, canDeleteDestructionList),
      getPermittedToolbarItem(
        BUTTON_READY_TO_REVIEW,
        (user, destructionList) =>
          canMarkAsReadyToReview(user, destructionList) &&
          destructionList.status === "new",
      ),

      getPermittedToolbarItem(
        BUTTON_ABORT_PROCESS,
        (user, destructionList) => destructionList.status !== "new",
      ),

      // Status: "changes_requested": "Opnieuw indienen"
      getPermittedToolbarItem(
        BUTTON_PROCESS_REVIEW,
        (user, destructionList) =>
          canMarkAsReadyToReview(user, destructionList) &&
          destructionList.status === "changes_requested",
      ),

      // Status: "internally_reviewed": "Markeren als definitief"
      getPermittedToolbarItem(BUTTON_MAKE_FINAL, canMarkListAsFinal),

      // Status: "ready_to_delete": "Vernietigen starten"/"Vernietigen herstarten"
      getPermittedToolbarItem(
        BUTTON_DESTROY,
        (user, destructionList) =>
          canTriggerDestruction(user, destructionList) &&
          ["new", "failed"].includes(destructionList.processingStatus),
      ),

      // Status: "ready_to_delete"
      getPermittedToolbarItem(BUTTON_CANCEL_DESTROY, isPlannedForDestruction),
    ];
  }, [user, destructionList, selectionSize]);
}
