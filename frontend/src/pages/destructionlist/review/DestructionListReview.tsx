import {
  ButtonProps,
  P,
  Solid,
  Toolbar,
  useConfirm,
  usePrompt,
} from "@maykin-ui/admin-ui";
import { useMemo } from "react";
import { useLoaderData, useRevalidator } from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import { ZaakReview } from "../../../lib/api/review";
import {
  ZaakSelection,
  addToZaakSelection,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { BaseListView } from "../abstract";
import { useZaakReviewStatusBadges } from "../hooks";
import { ReviewDestructionListAction } from "./DestructionListReview.action";
import "./DestructionListReview.css";
import { DestructionListReviewContext } from "./DestructionListReview.loader";

export const getDestructionListReviewKey = (id: string) =>
  `destruction-list-review-${id}`;

/**
 * Review-destruction-list page
 */
export function DestructionListReviewPage() {
  const prompt = usePrompt();
  const confirm = useConfirm();
  const revalidator = useRevalidator();

  // rows: AttributeData[], selected: boolean
  const {
    storageKey,
    uuid,
    destructionList,
    paginatedZaken,
    reviewItems,
    reviewResponse,
    excludedZaakSelection,
  } = useLoaderData() as DestructionListReviewContext;
  const submitAction = useSubmitAction<ReviewDestructionListAction>();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);
  const zaakReviewStatusBadges = useZaakReviewStatusBadges(
    storageKey,
    paginatedZaken.results,
  );

  // The object list of the current page with review actions appended.
  const objectList = useMemo(() => {
    return paginatedZaken.results.map((zaak) => {
      const badge = zaakReviewStatusBadges[zaak.url as string].badge;
      const actions = getActionsToolbarForZaak(zaak);
      return { ...zaak, Beoordeling: badge, Acties: actions };
    });
  }, [
    paginatedZaken,
    zaakReviewStatusBadges,
    reviewItems,
    excludedZaakSelection,
  ]);

  // The paginated object list of the current page with review actions appended.
  const paginatedObjectList = Object.assign(
    { ...paginatedZaken },
    { results: objectList },
  );

  /**
   * Returns a Toolbar providing the action for the `zaak`.
   * @param zaak
   */
  function getActionsToolbarForZaak(zaak: Zaak) {
    return (
      <Toolbar
        align="end"
        pad={false}
        variant="transparent"
        items={[
          {
            active: zaakReviewStatusBadges[zaak.url as string].status === true,
            children: (
              <>
                <Solid.HandThumbUpIcon />
                Accorderen
              </>
            ),
            pad: "h",
            variant: "primary",
            wrap: false,
            onClick: () => handleApproveClick(zaak),
          },
          {
            active: zaakReviewStatusBadges[zaak.url as string].status === false,
            children: (
              <>
                <Solid.HandThumbDownIcon />
                Uitzonderen
              </>
            ),
            pad: "h",
            variant: "danger",
            wrap: false,
            onClick: () => handleExcludeClick(zaak),
          },
        ]}
      />
    );
  }

  /**
   * Returns the button to show in the secondary navigation (top bar).
   */
  function getSubmitDestructionListButton(): ButtonProps {
    if (Object.keys(excludedZaakSelection).length) {
      return {
        children: (
          <>
            <Solid.HandThumbDownIcon />
            Afwijzen
          </>
        ),
        pad: "h",
        variant: "danger",
        onClick: () => handleRejectList(),
      };
    } else {
      return {
        children: (
          <>
            <Solid.HandThumbUpIcon />
            Goedkeuren
          </>
        ),
        pad: "h",
        variant: "primary",
        onClick: () => handleApproveList(),
      };
    }
  }

  /**
   * Returns `ZaakReview[]` of excluded zaken.
   * `approved`.
   */
  function getExcludedZaakReviews(): ZaakReview[] {
    const entries = Object.entries(excludedZaakSelection);
    return entries.map(([zaakUrl, selection]) => ({
      zaakUrl,
      feedback: selection.detail?.comment as string,
    }));
  }

  /**
   * Gets called when a zaak is approved.
   * @param zaak
   */
  function handleApproveClick(zaak: Zaak) {
    submitAction({
      type: "APPROVE_ITEM",
      payload: { destructionList: uuid, zaak: zaak.url as string },
    });
  }

  /**
   * Gets called when a zaak is excluded.
   * @param zaak
   */
  function handleExcludeClick(zaak: Zaak) {
    const reviewItem = reviewItems?.find((ri) => ri.zaak.url === zaak.url);
    const reviewItemReponse = reviewResponse?.itemsResponses.find(
      (ir) => ir.reviewItem === reviewItem?.pk,
    );

    prompt(
      `${zaak.identificatie} uitzonderen`,
      reviewItemReponse?.comment ? (
        <P>
          <strong>Opmerking:</strong> {reviewItemReponse?.comment}
        </P>
      ) : undefined,
      "Reden",
      "Zaak uitzonderen",
      "Annuleren",
      (comment) => {
        submitAction({
          type: "EXCLUDE_ITEM",
          payload: { comment, destructionList: uuid, zaak: zaak.url as string },
        });
      },
    );
  }

  /**
   * Gets called when the user reject the destruction list.
   */
  function handleRejectList() {
    prompt(
      `${destructionList.name} afwijzen`,
      undefined,
      "Reden",
      "Vernietigingslijst afwijzen",
      "Annuleren",
      (comment) => {
        const zaakReviews = getExcludedZaakReviews();

        submitAction({
          type: "REJECT_LIST",
          payload: { comment, destructionList: uuid, zaakReviews },
        });
      },
    );
  }

  /**
   * Gets called when the user approves the destruction list.
   */
  function handleApproveList() {
    prompt(
      `${destructionList.name} goedkeuren`,
      `U staat op het punt om vernietigingslijst ${destructionList.name} goed te keuren, wilt u doorgaan?`,
      "Opmerking",
      "Vernietigingslijst goedkeuren",
      "Annuleren",
      (comment) => {
        submitAction({
          type: "APPROVE_LIST",
          payload: { comment, destructionList: uuid },
        });
      },
    );
  }

  /**
   * Gets called when adding item to selection, filtering the selection.
   */
  const filterSelectionZaken = async (
    zaken: Zaak[],
    selected: boolean,
    pageSpecificZaakSelection: ZaakSelection<{
      approved: boolean;
      comment?: string;
    }>,
  ) => {
    // A guess if this is a "select" all action as we cant distinguish between:
    // - Select all with 1 zaak.
    // - Select single zaak.
    const selectAll = zaken.length > 1;

    // Zaak selection containing only zaken that are excluded.
    const excludedZaakSelection: ZaakSelection = Object.fromEntries(
      Object.entries(pageSpecificZaakSelection).filter(
        ([, item]) => item.detail?.approved === false,
      ),
    );

    // Zaken selected, allow all zaken except already excluded.
    // NOTE: approval status is retrieved via `getSelectionDetail()`.
    if (selected) {
      return zaken.filter((z) => {
        const url = z.url as string;
        return !(url in excludedZaakSelection);
      });
    }

    // All zaken on page deselected, only deselect approved zaken.
    if (!selected && selectAll) {
      const excludedUrls = Object.keys(excludedZaakSelection);
      return zaken.filter((z) => !excludedUrls.includes(z.url as string));
    }

    // We only want to do anything prompt-related with `excluded` zaken
    const isClickedZakenExcluded = zaken.some(
      (z) => z.url && z.url in excludedZaakSelection,
    );
    if (isClickedZakenExcluded) {
      confirm(
        `Weet je zeker dat je de beoordeling wilt verwijderen?`,
        "De opmerkingen en beoordelingen worden verwijderd.",
        "Verwijderen",
        "Annuleren",
        async () => {
          removeFromZaakSelection(storageKey, zaken);
          revalidator.revalidate();
        },
        async () => {
          // We want to re-add them with the `comments` present in the detail of the selection. (`pageSpecificZaakSelection[zaak.url].detail.comment`)
          const foundDetailForZakenPromise = zaken.map((z) => {
            const excludedZaakUrlsOnPage = Object.fromEntries(
              Object.entries(pageSpecificZaakSelection).filter(
                ([, item]) => item.detail?.approved === false,
              ),
            );

            const approved = !((z.url as string) in excludedZaakUrlsOnPage);
            const comment =
              pageSpecificZaakSelection[z.url as string]?.detail?.comment || "";
            return { approved, comment };
          });

          const foundDetailForZaken = await Promise.all(
            foundDetailForZakenPromise,
          );

          await addToZaakSelection(storageKey, zaken, foundDetailForZaken);
          revalidator.revalidate();
        },
      );
    }

    // 1 Zaak deselected, allow deselecting excluded zaak.
    // Multiple zaken deselected, prevent deselecting excluded zaak.
    return zaken.length <= 1
      ? zaken
      : zaken.filter((z) => {
          const url = z.url as string;
          return !(url in excludedZaakSelection);
        });
  };

  /**
   * Gets called when adding item to selection, manipulating the detail value.
   */
  const getSelectionDetail = async (
    zaak: Zaak,
    pageSpecificZaakSelection: ZaakSelection<{ approved: boolean }>,
  ) => {
    const excludedZaakUrlsOnPage = Object.fromEntries(
      Object.entries(pageSpecificZaakSelection).filter(
        ([, item]) => item.detail?.approved === false,
      ),
    );

    const approved = !((zaak.url as string) in excludedZaakUrlsOnPage);
    return { approved };
  };

  /**
   * Gets called when the selection changes outside of the per-zaak toolbar.
   * Revalidates the loader so the selection is up2date.
   */
  const handleSelectionChange = () => {
    revalidator.revalidate();
  };

  return (
    <BaseListView
      storageKey={destructionListReviewKey}
      destructionList={destructionList}
      paginatedZaken={paginatedObjectList}
      secondaryNavigationItems={[getSubmitDestructionListButton()]}
      extraFields={[
        { filterable: false, name: "Beoordeling", type: "text" },
        { filterable: false, name: "Acties", type: "text" },
      ]}
      // @ts-expect-error - Generic type of zaakSelection
      filterSelectionZaken={filterSelectionZaken}
      // @ts-expect-error - Generic type of zaakSelection
      getSelectionDetail={getSelectionDetail}
      dataGridProps={{
        labelSelect: "Markeren als (on)gezien",
        labelSelectAll: "Alles als (on)gezien markeren",
      }}
      onSelectionChange={handleSelectionChange}
      onClearZaakSelection={handleSelectionChange}
    ></BaseListView>
  );
}
