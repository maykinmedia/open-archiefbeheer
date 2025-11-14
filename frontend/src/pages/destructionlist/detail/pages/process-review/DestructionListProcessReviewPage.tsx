import {
  AttributeTable,
  Badge,
  Outline,
  Solid,
  Toolbar,
  Tooltip,
  TypedField,
} from "@maykin-ui/admin-ui";
import { JSX, useMemo, useState } from "react";
import { useRevalidator, useRouteLoaderData } from "react-router-dom";

import { useZaakReviewStatuses, useZaakSelection } from "../../../../../hooks";
import { PaginatedZaken } from "../../../../../lib/api/zaken";
import { paginatedDestructionListItems2paginatedZaken } from "../../../../../lib/format/destructionList";
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
  Mutatie: string;
  Acties: JSX.Element;
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
    zaakSelection, // FIXME: remove usage
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

  const [, handleSelect, { zaakSelectionOnPage }] = useZaakSelection<{
    approved?: boolean;
    action?: ProcessReviewAction;
    selectielijstklasse?: string;
    archiefactiedatum?: string;
    comment?: string;
  }>(storageKey, zakenOnPage);
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
        : paginatedDestructionListItems2paginatedZaken(destructionListItems)
            .results,
    [selectionClearedState, destructionListItems],
  );

  // Whether extra fields should be rendered.
  const extraFields: TypedField<ReviewMeta>[] = [
    { name: "Opmerking", type: "text" },
    { name: "Mutatie", type: "text" },
    { name: "Acties", type: "jsx" },
  ];

  // The object list of the current page with review actions appended.
  const objectList = useMemo(() => {
    return zakenOnPage.map((z, i) => ({
      ...z,
      Opmerking: reviewItems?.[i]?.feedback,
      Mutatie: getProcessReviewBadge(z),
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
            <Badge level="info" style={{ display: "block" }} tabIndex={0}>
              <Solid.DocumentPlusIcon />
              Voorstel afgewezen
            </Badge>
          ) : (
            <Badge level="danger" style={{ display: "block" }} tabIndex={0}>
              <Solid.DocumentMinusIcon />
              Uitgezonderd
            </Badge>
          )}
        </span>
      </Tooltip>
    );
  }

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

  return (
    <BaseListView<Zaak & ReviewMeta>
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
