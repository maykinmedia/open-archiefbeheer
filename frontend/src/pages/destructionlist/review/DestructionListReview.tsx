import {
  Badge,
  BadgeProps,
  ButtonProps,
  P,
  Solid,
  Toolbar,
  usePrompt,
} from "@maykin-ui/admin-ui";
import React, { useMemo } from "react";
import { useLoaderData } from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import { ZaakReview } from "../../../lib/api/review";
import { ZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { BaseListView } from "../abstract";
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

  // rows: AttributeData[], selected: boolean
  const {
    destructionList,
    reviewItems,
    reviewResponse,
    zaken,
    approvedZaakUrlsOnPage,
    excludedZaakSelection,
    uuid,
  } = useLoaderData() as DestructionListReviewContext;

  const submitAction = useSubmitAction<ReviewDestructionListAction>();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);

  // The object list of the current page with review actions appended.
  const objectList = useMemo(() => {
    const zakenOrReviewItems =
      reviewItems && reviewItems.length ? reviewItems : zaken.results;

    const objects: Zaak[] = zakenOrReviewItems.map((zori) =>
      "zaak" in zori ? zori.zaak : zori,
    );

    return objects.map((zaak) => {
      const badge = getReviewBadgeForZaak(zaak);
      const actions = getActionsToolbarForZaak(zaak);
      return { ...zaak, Beoordeling: badge, Acties: actions };
    });
  }, [reviewItems, zaken, excludedZaakSelection]);

  // The paginated object list of the current page with review actions appended.
  const paginatedObjectList = Object.assign(
    { ...zaken },
    { results: objectList },
  );

  /**
   * Returns a Badge indicating the review status of the `zaak`.
   * @param zaak
   */
  function getReviewBadgeForZaak(zaak: Zaak): React.ReactNode {
    const approved = getApprovalStatusForZaak(zaak);
    let icon: React.ReactNode = null;
    let label = "";
    let level: BadgeProps["level"];

    if (typeof approved === "boolean") {
      if (approved) {
        icon = <Solid.HandThumbUpIcon />;
        label = "Geaccordeerd";
        level = "success";
      } else {
        icon = <Solid.HandThumbDownIcon />;
        label = "Uitgezonderd";
        level = "danger";
      }
    } else {
      icon = <Solid.QuestionMarkCircleIcon />;
      label = "Niet beoordeeld";
      level = undefined;
    }
    return (
      // @ts-expect-error - style props not supported (yet?)
      <Badge level={level} style={{ display: "block" }}>
        {icon}
        {label}
      </Badge>
    );
  }

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
            active: getApprovalStatusForZaak(zaak) === true,
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
            active: getApprovalStatusForZaak(zaak) === false,
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
   * Returns whether a zaak is approved (`boolean`) or not reviewed (`null`).
   * @param zaak
   */
  function getApprovalStatusForZaak(zaak: Zaak): boolean | null {
    // Approved.
    if (approvedZaakUrlsOnPage.includes(zaak.url as string)) {
      return true;
    }

    // Excluded
    if (Object.keys(excludedZaakSelection).includes(zaak.url as string)) {
      return false;
    }

    // Not selected.
    return null;
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
    pageSpecificZaakSelection: ZaakSelection<{ approved: boolean }>,
  ) => {
    const excludedZaakSelection = Object.fromEntries(
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

  return (
    <BaseListView
      storageKey={destructionListReviewKey}
      destructionList={destructionList}
      paginatedResults={paginatedObjectList}
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
    ></BaseListView>
  );
}
