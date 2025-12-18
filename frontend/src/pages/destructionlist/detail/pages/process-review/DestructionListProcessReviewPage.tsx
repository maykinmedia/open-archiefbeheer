import {
  AttributeTable,
  Badge,
  Outline,
  Solid,
  Toolbar,
  ToolbarItem,
  Tooltip,
  TypedField,
} from "@maykin-ui/admin-ui";
import { JSX, useMemo, useState } from "react";
import { useRevalidator, useRouteLoaderData } from "react-router-dom";

import { RelatedObjectsSelectionModal } from "../../../../../components";
import { useZaakReviewStatuses, useZaakSelection } from "../../../../../hooks";
import { DestructionListItem } from "../../../../../lib/api/destructionListsItem";
import { PaginatedResults } from "../../../../../lib/api/paginatedResults";
import { ReviewItem } from "../../../../../lib/api/review";
import { paginatedDestructionListItems2DestructionDetailData } from "../../../../../lib/format/destructionList";
import { ZaakSelection } from "../../../../../lib/zaakSelection";
import { Zaak } from "../../../../../types";
import { BaseListView } from "../../../abstract";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { useSecondaryNavigation } from "../../hooks";
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

type ReviewMeta = {
  Opmerking: string;
  Mutatie: JSX.Element;
  Acties: JSX.Element;
};

type DestructionListProcessReviewData = Zaak & ReviewMeta;

type ReviewItemWithZaak = Omit<ReviewItem, "destructionListItem"> & {
  destructionListItem: Omit<DestructionListItem, "zaak"> & { zaak: Zaak };
};

/**
 * Show items of a destruction list review.
 * Allows processing feedback of the destruction list.
 */
export function DestructionListProcessReviewPage() {
  const {
    storageKey: loaderStorageKey,
    destructionList,
    destructionListItems,
    zaakSelection, // FIXME: remove usage
    review,
    reviewItems: _reviewItems = [],
    selectieLijstKlasseChoicesMap,
    user,
  } = useRouteLoaderData(
    "destruction-list:detail",
  ) as DestructionListDetailContext;
  const reviewItems: ReviewItemWithZaak[] =
    (_reviewItems?.filter(
      (ri) => ri.destructionListItem.zaak,
    ) as ReviewItemWithZaak[]) || [];

  const zakenOnPage: Zaak[] =
    reviewItems.map((ri) => ri.destructionListItem.zaak!) || [];

  const [selectionClearedState, setSelectionClearedState] = useState(false);
  const revalidator = useRevalidator();
  const secondaryNavigation =
    useSecondaryNavigation<DestructionListDetailContext>();

  const [, handleSelect, { zaakSelectionOnPage }] = useZaakSelection<{
    approved?: boolean;
    action?: ProcessReviewAction;
    selectielijstklasse?: string;
    archiefactiedatum?: string;
    comment?: string;
  }>(getStorageKey(), zakenOnPage);
  const zaakReviewStatuses = useZaakReviewStatuses(
    zakenOnPage,
    zaakSelectionOnPage,
  );

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
        : paginatedDestructionListItems2DestructionDetailData(
            destructionListItems,
            destructionList,
            user,
          ).results,
    [selectionClearedState, destructionListItems, destructionList, user],
  );

  // The object list of the current page with review actions appended.
  const objectList = useMemo<DestructionListProcessReviewData[]>(() => {
    return (reviewItems || []).map(({ destructionListItem }, i) => ({
      ...destructionListItem.zaak,
      "Gerelateerde objecten": (
        <RelatedObjectsSelectionModal
          amount={destructionListItem.zaak.zaakobjecten?.length || 0}
          destructionList={destructionList}
          destructionListItemPk={destructionListItem.pk}
          user={user}
        />
      ),
      Opmerking: reviewItems?.[i]?.feedback ?? "",
      Mutatie: getProcessReviewBadge(destructionListItem.zaak),
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
                  destructionListItem.zaak,
                  destructionListItem.zaak.url in zaakReviewStatuses,
                ),
            },
          ]}
        />
      ),
    }));
  }, [reviewItems, zaakReviewStatuses, user]);

  /**
   * Get the process review badge for a zaak to know what mutation is proposed.
   */
  function getProcessReviewBadge(zaak: Zaak) {
    const processZaakReviewDetail =
      processZaakReviewSelectionState?.[zaak.url as string]?.detail;
    const action = processZaakReviewDetail?.action;

    if (!action) {
      return (
        <Badge style={{ display: "block" }} tabIndex={0}>
          <Solid.QuestionMarkCircleIcon />
          Geen Mutatie
        </Badge>
      );
    }

    const { archiefactiedatum, selectielijstklasse, comment } =
      processZaakReviewDetail;

    const getLabel = (value: string | undefined) =>
      selectieLijstKlasseChoicesMap?.[zaak.url]?.find(
        (choice) => choice.value === value,
      )?.label;

    const tooltipData: Record<string, string | undefined | number> = {};

    // Only add the new archiefactiedatum if it exists and is different from the old one.
    // Additionally, include the old date if it was previously set.
    if (archiefactiedatum && archiefactiedatum !== zaak.archiefactiedatum) {
      tooltipData["Archiefactiedatum (nieuw)"] = archiefactiedatum;

      // Include the old archiefactiedatum only if it is defined.
      if (zaak.archiefactiedatum) {
        tooltipData["Archiefactiedatum (oud)"] = zaak.archiefactiedatum;
      }
    }

    const newSelectielijstklasse = getLabel(selectielijstklasse);
    const oldSelectielijstklasse = getLabel(zaak?.selectielijstklasse);

    // Only add the new selectielijstklasse if it exists and is different from the old one.
    // Additionally, include the old selectielijstklasse if it was previously set.
    if (
      newSelectielijstklasse &&
      newSelectielijstklasse !== oldSelectielijstklasse
    ) {
      tooltipData["Selectielijstklasse (nieuw)"] = newSelectielijstklasse;

      // Include the old selection list class only if it is defined.
      if (oldSelectielijstklasse) {
        tooltipData["Selectielijstklasse (oud)"] = oldSelectielijstklasse;
      }
    }

    // Always include the comment if it is defined.
    if (comment) {
      tooltipData["Opmerking"] = comment;
    }

    const tooltipContent =
      Object.keys(tooltipData).length > 0 ? (
        <AttributeTable object={tooltipData} compact />
      ) : (
        "Geen wijzigingen"
      );

    return (
      <Tooltip content={tooltipContent} size="md">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <span tabIndex={0}>
          {action === "keep" ? (
            <Badge variant="info" style={{ display: "block" }} tabIndex={0}>
              <Solid.DocumentPlusIcon />
              Voorstel afgewezen
            </Badge>
          ) : (
            <Badge variant="danger" style={{ display: "block" }} tabIndex={0}>
              <Solid.DocumentMinusIcon />
              Uitgezonderd
            </Badge>
          )}
        </span>
      </Tooltip>
    );
  }

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
      await handleSelect([zaak], false);

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
    await handleSelect([{ url: zaakUrl }], true, {
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

  //
  // Common.
  //

  /**
   * Generates a list of extra fields for rendering or processing, based on specific conditions.
   */
  function getExtraFields(): TypedField<DestructionListProcessReviewData>[] {
    return [
      { name: "Opmerking", type: "text" },
      { name: "Mutatie", type: "text" },
      { name: "Acties", type: "jsx" },
    ];
  }

  /**
   * Retrieves a paginated list of objects.
   */
  function getPaginatedObjectList(): PaginatedResults<DestructionListProcessReviewData> {
    return {
      count: reviewItems?.length || 0,
      next: null,
      previous: null,
      results: objectList,
    };
  }

  /**
   * Retrieves the secondary navigation items.
   */
  function getSecondaryNavigationItems(): ToolbarItem[] {
    return secondaryNavigation;
  }

  /**
   * A memoized callback function that retrieves the storage key.
   */
  function getStorageKey(): string {
    return loaderStorageKey;
  }

  return (
    <BaseListView<DestructionListProcessReviewData>
      // Common
      destructionList={destructionList}
      extraFields={getExtraFields()}
      paginatedObjectList={getPaginatedObjectList()}
      secondaryNavigationItems={getSecondaryNavigationItems()}
      storageKey={getStorageKey()}
      // Specific
      initiallySelectedZakenOnPage={initiallySelectedZakenOnPage}
      review={review || undefined}
      selectable="visible"
      onClearZaakSelection={handleClearSelection}
    >
      {/* The "feedback" modal */}
      <DestructionListProcessZaakReviewModal
        zaakModalDataState={processZaakReviewModalState}
        reviewItem={
          reviewItems?.find(
            (ri) =>
              ri.destructionListItem.zaak.url ===
              processZaakReviewModalState.zaak?.url,
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
