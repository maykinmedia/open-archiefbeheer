import { Outline, Toolbar, TypedField } from "@maykin-ui/admin-ui";
import React, { useMemo, useState } from "react";
import { useRevalidator, useRouteLoaderData } from "react-router-dom";

import { useZaakReviewStatuses } from "../../../../../hooks";
import { PaginatedDestructionListItems } from "../../../../../lib/api/destructionListsItem";
import { PaginatedZaken } from "../../../../../lib/api/zaken";
import { ZaakSelection } from "../../../../../lib/zaakSelection";
import {
  addToZaakSelection,
  removeFromZaakSelection,
} from "../../../../../lib/zaakSelection";
import { Zaak } from "../../../../../types";
import { BaseListView } from "../../../abstract";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { useSecondaryNavigation } from "../../hooks/useSecondaryNavigation";
import {
  DestructionListProcessZaakReviewModal,
  ProcessReviewAction,
} from "./components";

type ZaakModalDataState = {
  open: boolean;
  zaak?: Zaak;
};

type ProcessZaakReviewSelectionDetail = {
  comment: string;
  action: ProcessReviewAction;
  selectielijstklasse: string;
  archiefactiedatum: string;
};

/**
 * Show items of a destruction list review.
 * Allows processing feedback of the destruction list.
 */
export function DestructionListProcessReviewPage() {
  const {
    storageKey,
    destructionList,
    destructionListItems,
    zaakSelection,
    review,
    reviewItems = [],
    selectieLijstKlasseChoicesMap,
  } = useRouteLoaderData(
    "destruction-list:detail",
  ) as DestructionListDetailContext;
  const zakenOnPage = reviewItems?.map((ri) => ri.zaak) || [];

  const [selectionClearedState, setSelectionClearedState] = useState(false);
  const revalidator = useRevalidator();
  const secondaryNavigationItems = useSecondaryNavigation();
  const zaakReviewStatuses = useZaakReviewStatuses(storageKey, zakenOnPage);

  // State to manage the state of the zaak modal (when clicking a checkbox)
  const [processZaakReviewModalState, setProcessZaakReviewModalState] =
    useState<ZaakModalDataState>({
      open: false,
    });

  // The zaak selection typed correctly for use when providing feedback on a review.
  const processZaakReviewSelectionState =
    zaakSelection as ZaakSelection<ProcessZaakReviewSelectionDetail>;

  // The details possibly provided by the user after processing a review for a zaak.
  const processZaakReviewDetail =
    processZaakReviewSelectionState?.[
      processZaakReviewModalState.zaak?.url || ""
    ]?.detail;

  // The initially select items.
  const initiallySelectedZakenOnPage = useMemo(
    () =>
      selectionClearedState
        ? []
        : paginatedDestructionListItems2paginatedZaken(destructionListItems)
            .results,
    [selectionClearedState, destructionListItems],
  );

  /**
   * Converts `PaginatedDestructionListItems` to `PaginatedZaken`.
   */
  function paginatedDestructionListItems2paginatedZaken(
    paginatedDestructionListItems: PaginatedDestructionListItems,
  ): PaginatedZaken {
    return {
      ...paginatedDestructionListItems,
      results: paginatedDestructionListItems.results
        .map((dli) => ({ ...dli.zaak, processingStatus: dli.processingStatus }))
        // @ts-expect-error - FIXME: Adding "processingStatus" to zaak.
        .filter((v): v is Zaak => Boolean(v)) as Zaak[],
    };
  }

  // Whether extra fields should be rendered.
  const extraFields: TypedField[] = [
    { filterable: false, name: "Opmerking", type: "text" },
    { filterable: false, name: "Acties", type: "text" },
  ];

  // The object list of the current page with review actions appended.
  const objectList = useMemo(() => {
    return zakenOnPage.map((z, i) => ({
      ...z,
      Opmerking: reviewItems?.[i]?.feedback,
      Acties: (
        <Toolbar
          align="end"
          pad={false}
          variant="transparent"
          items={[
            {
              children: (
                <>
                  <Outline.ChatBubbleLeftRightIcon />
                  Muteren
                </>
              ),
              pad: "h",
              variant: "primary",
              wrap: false,
              onClick: () =>
                handleProcessReviewZaakSelect(
                  z,
                  (z.url as string) in zaakReviewStatuses,
                ),
            },
          ]}
        />
      ),
    }));
  }, [reviewItems, zaakReviewStatuses]);

  // DataGrid (paginated) results.
  const paginatedZaken = useMemo<PaginatedZaken>(() => {
    return {
      count: reviewItems?.length || 0,
      next: null,
      previous: null,
      results: objectList,
    };
  }, [reviewItems, objectList]);

  /**
   * Gets called when te selection is cleared.
   */
  const handleClearSelection = async () => {
    setSelectionClearedState(true);
  };

  /**
   * Get called when the user selects a zaak when a review is received.
   */
  const handleProcessReviewZaakSelect = async (
    zaak: Zaak,
    selected: boolean,
  ) => {
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
    archiefactiedatum: string | undefined,
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

  return (
    <BaseListView
      destructionList={destructionList}
      review={review || undefined}
      extraFields={extraFields}
      initiallySelectedZakenOnPage={initiallySelectedZakenOnPage}
      paginatedZaken={paginatedZaken}
      secondaryNavigationItems={secondaryNavigationItems}
      selectable="visible"
      storageKey={storageKey}
      onClearZaakSelection={handleClearSelection}
    >
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
    </BaseListView>
  );
}
