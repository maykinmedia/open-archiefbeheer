import {
  P,
  Solid,
  Toolbar,
  TypedField,
  useConfirm,
  usePrompt,
} from "@maykin-ui/admin-ui";
import { invariant } from "@maykin-ui/client-common";
import { JSX } from "react";
import { useLoaderData } from "react-router-dom";

import { RelatedObjectsSelectionModal } from "../../../components";
import {
  usePoll,
  useZaakReviewStatusBadges,
  useZaakSelection,
} from "../../../hooks";
import { PaginatedResults } from "../../../lib/api/paginatedResults";
import {
  RestBackend,
  ZaakIdentifier,
  ZaakSelection,
  addToZaakSelection,
  compareZaakSelection,
  getZaakSelectionItems,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection";
import { Zaak } from "../../../types";
import { BaseListView } from "../abstract";
import { useSecondaryNavigation } from "../detail/hooks";
import "./DestructionListReview.css";
import { DestructionListReviewContext } from "./DestructionListReview.loader";

/**
 * Warning! This key needs to remain in sync with the key created by the backend,
 * since the backend can pre-populate the selection after a review is processed by
 * the record manager. See github issue #498
 */
export const getDestructionListReviewKey = (id: string, status: string) =>
  `destruction-list-review-${id}-${status}`;

/** The maximum default cache age. */
export const CO_REVIEW_POLL_INTERVAL = parseInt(
  import.meta.env.OAB_CO_REVIEW_POLL_INTERVAL || 3000,
);

type DestructionListReviewData = Zaak & {
  "Gerelateerde objecten"?: JSX.Element;
  Beoordeling?: JSX.Element;
  Acties?: JSX.Element;
};

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
    user,
  } = useLoaderData() as DestructionListReviewContext;

  const zakenResults = paginatedZaken.results
    .map((zaak) => zaak.zaak)
    .filter((zaak) => zaak !== null) as Zaak[];

  // Don't use the BaseListView zaak selection due to conflicting requirements, use custom implementation instead.
  const [
    selectedZakenOnPage,
    handleSelect,
    { zaakSelectionOnPage, clearZaakSelection, revalidateZaakSelection },
  ] = useZaakSelection<{
    approved: boolean;
    comment: string;
  }>(
    storageKey,
    zakenResults,
    filterSelectionZaken,
    getSelectionDetail,
    RestBackend,
  );

  // Poll for changes, update selection if a (remote) change has been made (by
  // another reviewer).
  usePoll(
    async () => {
      const pollZaakSelection = await getZaakSelectionItems<{
        approved: boolean;
        comment: string;
      }>(
        storageKey,
        zakenResults.map((zaak) => zaak.url as string),
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
    },
    [JSON.stringify(zaakSelectionOnPage)],
    { timeout: CO_REVIEW_POLL_INTERVAL },
  );

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

  // Get secondary navigation items.
  const secondaryNavigation =
    useSecondaryNavigation<DestructionListReviewContext>(
      "destruction-list:review",
      excludedZaakSelection,
    );

  const reviewAdviceIgnoredResults = Object.fromEntries(
    paginatedZaken.results.map((result) => [
      result.zaak?.url as string,
      result.reviewAdviceIgnored || false,
    ]),
  );

  const destructionListReviewKey = getDestructionListReviewKey(
    uuid,
    destructionList.status,
  );

  const zaakReviewStatusBadges = useZaakReviewStatusBadges(
    paginatedZaken.results,
    {
      ...approvedZaakSelection,
      ...excludedZaakSelection,
    },
    reviewAdviceIgnoredResults,
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
   * Gets called when a zaak is approved.
   * @param zaak
   */
  async function handleApproveClick(zaak: Zaak) {
    return handleSelect([zaak], true, {
      approved: true,
      comment: "",
    });
  }

  /**
   * Gets called when a zaak is excluded.
   * @param zaak
   */
  function handleExcludeClick(zaak: Zaak) {
    const reviewItem = reviewItems?.find(
      (ri) => ri.destructionListItem.zaak?.url === zaak.url,
    );
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
        handleSelect([zaak], true, {
          approved: false,
          comment,
        }),
    );
  }

  /**
   * Gets called when adding item to selection, filtering the selection.
   */
  async function filterSelectionZaken(
    zaken: ZaakIdentifier[],
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

    // All zaken selected, allow all zaken except already excluded.
    // NOTE: approval status is retrieved via `getSelectionDetail()`.
    if (selected && selectAll) {
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
    if (zaken.length > 1) {
      return zaken.filter((z) => {
        const url = z.url as string;
        return !(url in excludedZaakSelection);
      });
    }

    return zaken;
  }

  /**
   * Gets called when adding items to selection using "select all", returning
   * the detail value.
   */
  async function getSelectionDetail(zaak: ZaakIdentifier) {
    const approved = !((zaak.url as string) in excludedZaakSelection);
    return { approved, comment: "" };
  }

  //
  // Common.
  //

  /**
   * Generates a list of extra fields for rendering or processing, based on specific conditions.
   */
  function getExtraFields(): TypedField<DestructionListReviewData>[] {
    return [
      { name: "Beoordeling", type: "text" },
      { name: "Acties", type: "text", width: "230px" },
    ];
  }

  /**
   * Retrieves a paginated list of objects.
   */
  function getPaginatedObjectList(): PaginatedResults<DestructionListReviewData> {
    const objectList = paginatedZaken.results
      .filter((r) => r.zaak)
      .map(({ pk, zaak }) => {
        invariant(zaak, "zaak is undefined!");

        const gerelateerdeObjecten = (
          <RelatedObjectsSelectionModal
            amount={zaak?.zaakobjecten?.length || 0}
            destructionList={destructionList}
            destructionListItemPk={pk}
            user={user}
          />
        );
        const badge = zaakReviewStatusBadges[zaak.url].badge;
        const actions = getActionsToolbarForZaak(zaak);
        return {
          ...zaak,
          "Gerelateerde objecten": gerelateerdeObjecten,
          Beoordeling: badge,
          Acties: actions,
        };
      });

    return { ...paginatedZaken, results: objectList };
  }

  /**
   * Retrieves the secondary navigation items.
   */
  function getSecondaryNavigationItems() {
    return secondaryNavigation;
  }

  /**
   * A memoized callback function that retrieves the storage key.
   */
  function getStorageKey(): string {
    return destructionListReviewKey;
  }

  return (
    <BaseListView<DestructionListReviewData>
      // Common
      destructionList={destructionList}
      extraFields={getExtraFields()}
      paginatedObjectList={getPaginatedObjectList()}
      secondaryNavigationItems={getSecondaryNavigationItems()}
      storageKey={getStorageKey()}
      // Specific
      dataGridProps={{
        labelSelect: "Markeren als (on)gezien",
        labelSelectAll: "Alles als (on)gezien markeren",
        selected: selectedZakenOnPage as Zaak[],
        onSelect: handleSelect,
      }}
      selectionBackend={null}
      onClearZaakSelection={clearZaakSelection}
    ></BaseListView>
  );
}
