import {
  AttributeData,
  ButtonProps,
  P,
  Solid,
  Toolbar,
  useConfirm,
  usePrompt,
} from "@maykin-ui/admin-ui";
import React, { useMemo } from "react";
import { useLoaderData } from "react-router-dom";

import {
  usePoll,
  useSubmitAction,
  useWhoAmI,
  useZaakReviewStatusBadges,
  useZaakSelection,
} from "../../../hooks";
import { ZaakReview } from "../../../lib/api/review";
import {
  RestBackend,
  ZaakSelection,
  addToZaakSelection,
  compareZaakSelection,
  getZaakSelectionItems,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection";
import { Zaak } from "../../../types";
import { BaseListView } from "../abstract";
import { ReviewDestructionListAction } from "./DestructionListReview.action";
import "./DestructionListReview.css";
import { DestructionListReviewContext } from "./DestructionListReview.loader";

export const getDestructionListReviewKey = (id: string, status: string) =>
  `destruction-list-review-${id}-${status}`;

/**
 * Review-destruction-list page
 */
export function DestructionListReviewPage() {
  const prompt = usePrompt();
  const confirm = useConfirm();

  // rows: AttributeData[], selected: boolean
  const {
    storageKey,
    uuid,
    destructionList,
    paginatedZaken,
    reviewItems,
    reviewResponse,
  } = useLoaderData() as DestructionListReviewContext;

  const user = useWhoAmI();

  // Don't use the BaseListView zaak selection due to conflicting requirements, use custom implementation instead.
  const [, handleSelect, { zaakSelectionOnPage, revalidateZaakSelection }] =
    useZaakSelection<{
      approved: boolean;
      comment: string;
    }>(
      storageKey,
      paginatedZaken.results,
      filterSelectionZaken,
      getSelectionDetail,
      RestBackend,
    );

  // Poll for changes, update selection if a (remote) change has been made (by
  // another reviewer).
  usePoll(async () => {
    const pollZaakSelection = await getZaakSelectionItems<{
      approved: boolean;
      comment: string;
    }>(
      storageKey,
      paginatedZaken.results.map((z) => z.url as string),
      true,
      RestBackend,
    );

    const hasChanged = !compareZaakSelection(
      pollZaakSelection,
      zaakSelectionOnPage,
    );
    if (hasChanged) {
      revalidateZaakSelection();
    }
  });

  // Get zaak selection for approved zaken.
  const approvedZaakSelection: ZaakSelection<{
    approved: boolean;
    comment: string;
  }> = Object.fromEntries(
    Object.entries(zaakSelectionOnPage).filter(
      ([, selectionItem]) =>
        selectionItem.selected && selectionItem.detail?.approved === true,
    ),
  );

  // Get zaak selection for excluded zaken.
  const excludedZaakSelection: ZaakSelection<{
    approved: boolean;
    comment: string;
  }> = Object.fromEntries(
    Object.entries(zaakSelectionOnPage).filter(
      ([, selectionItem]) =>
        selectionItem.selected && selectionItem.detail?.approved === false,
    ),
  );

  const submitAction = useSubmitAction<ReviewDestructionListAction>();
  const destructionListReviewKey = getDestructionListReviewKey(
    uuid,
    destructionList.status,
  );
  const zaakReviewStatusBadges = useZaakReviewStatusBadges(
    paginatedZaken.results,
    { ...approvedZaakSelection, ...excludedZaakSelection },
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
  function getSubmitDestructionListButton(): ButtonProps | null {
    if (!user?.role.canReviewDestruction && !user?.role.canReviewFinalList) {
      return null; // TODO: Implement mark ready
    }
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
  async function handleApproveClick(zaak: Zaak) {
    return handleSelect([zaak] as unknown as AttributeData[], true, {
      approved: true,
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
      async (comment) =>
        handleSelect([zaak] as unknown as AttributeData[], true, {
          approved: false,
          comment,
        }),
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
          payload: {
            comment,
            destructionList: uuid,
            status: destructionList.status,
            zaakReviews,
          },
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
          payload: {
            comment,
            destructionList: uuid,
            status: destructionList.status,
          },
        });
      },
    );
  }

  /**
   * Gets called when adding item to selection, filtering the selection.
   */
  async function filterSelectionZaken(
    zaken: Zaak[],
    selected: boolean,
    pageSpecificZaakSelection: ZaakSelection<{
      approved: boolean;
      comment?: string;
    }>,
  ) {
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
          removeFromZaakSelection(storageKey, zaken, RestBackend);
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

          await addToZaakSelection(
            storageKey,
            zaken,
            foundDetailForZaken,
            RestBackend,
          );
          revalidateZaakSelection();
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
  }

  /**
   * Gets called when adding items to selection using "select all", returning
   * the detail value.
   */
  async function getSelectionDetail(zaak: Zaak) {
    const approved = !((zaak.url as string) in excludedZaakSelection);
    return { approved, comment: "" };
  }

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
      dataGridProps={{
        labelSelect: "Markeren als (on)gezien",
        labelSelectAll: "Alles als (on)gezien markeren",
        onSelect: handleSelect,
      }}
      selectionBackend={RestBackend}
    ></BaseListView>
  );
}
