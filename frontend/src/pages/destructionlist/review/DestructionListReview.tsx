import {
  AttributeData,
  Badge,
  BadgeProps,
  ButtonProps,
  DataGridProps,
  ListTemplate,
  P,
  Solid,
  Toolbar,
  useConfirm,
  usePrompt,
} from "@maykin-ui/admin-ui";
import React, { useMemo } from "react";
import { useLoaderData, useLocation, useMatch } from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import { ZaakReview } from "../../../lib/api/review";
import { Zaak } from "../../../types";
import { DestructionListToolbar } from "../detail/components/DestructionListToolbar/DestructionListToolbar";
import { useDataGridProps } from "../hooks";
import { ReviewDestructionListAction } from "./DestructionListReview.action";
import "./DestructionListReview.css";
import { DestructionListReviewContext } from "./DestructionListReview.loader";

export const getDestructionListReviewKey = (id: string) =>
  `destruction-list-review-${id}`;

/**
 * Review-destruction-list page
 */
export function DestructionListReviewPage() {
  const confirm = useConfirm();
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

  // DataGrid props.
  const { props: baseDataGridProps } = useDataGridProps(
    destructionListReviewKey,
    paginatedObjectList,
    getSelectedUrlsOnPage(),
    undefined,
    undefined,
    destructionList.uuid,
  );
  const dataGridProps: DataGridProps = {
    ...baseDataGridProps,
    fields: [
      ...(baseDataGridProps.fields || []),
      { filterable: false, name: "Beoordeling", type: "text" },
      { filterable: false, name: "Acties", type: "text" },
    ],
    labelSelect: "Markeren als (on)gezien",
    labelSelectAll: "Alles als (on)gezien markeren",
    onSelect: handleSelect,
  };

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
   * Returns the urls of the selected zaken.
   */
  function getSelectedUrlsOnPage() {
    return [...approvedZaakUrlsOnPage, ...Object.keys(excludedZaakSelection)];
  }

  /**
   * Returns `ZaakReview[]` of excluded zaken.
   * `approved`.
   */
  function getExcludedZaakReviews(): ZaakReview[] {
    return Object.entries(excludedZaakSelection).map(
      ([zaakUrl, selection]) => ({
        zaakUrl,
        feedback: selection.detail?.comment as string,
      }),
    );
  }

  /**
   * Gets called when a checkbox is clicked, this can either be a single row or
   * the "select all" checkbox.
   *
   * Select single zaak:
   *
   * - Checking selects and approves zaak.
   * - Unchecking unselects zaak.
   *
   * Select all:
   *
   * - Checking selects and approves all unselected zaken on page.
   * - Unchecking unselects all approved zaken on page.
   *
   *
   * @param rows
   * @param selected
   */
  function handleSelect(rows: AttributeData[], selected: boolean) {
    let zaken = rows;

    if (rows.length === 0) {
      zaken = objectList as AttributeData[];
    }

    /**
     * Returns batches of zaak urls to select (`shouldSelect=true`) or
     * unselect (`shouldSelect=false`).
     * @param shouldSelect
     */
    const filterZaken = (shouldSelect: boolean): string[] =>
      zaken
        .filter((zaak) => {
          const isSelectAll = rows.length === 0;
          const url = zaak.url as string;

          const approved = approvedZaakUrlsOnPage.includes(url)
            ? true
            : Object.keys(excludedZaakSelection).includes(url)
              ? false
              : undefined;

          // Get items to select.
          if (shouldSelect) {
            // Checking selects and approves zaak (or all zaken on page if select all is checked).
            return selected && approved !== false;
          }
          // Get items to unselect.
          else {
            if (isSelectAll) {
              // Unchecking unselects all approved zaken on page.
              return !selected && approved !== false;
            } else {
              // Unchecking unselects zaak.
              return !selected;
            }
          }
        })
        .map((z) => z.url as string);

    const zakenToApprove = filterZaken(true);
    const zakenToUnselect = filterZaken(false);
    const zakenToUnselectIncludesExcludedZaak = zakenToUnselect.some((url) => {
      Object.keys(excludedZaakSelection).includes(url);
    });

    submitAction({
      type: "APPROVE_ITEMS",
      payload: { destructionList: uuid, zaken: zakenToApprove },
    });

    const handleUnselectItems = (zakenToUnselect: string[]) => {
      // Fix race condition on Safari (17.1.2) with sessionStorage being used.
      setTimeout(() => {
        submitAction({
          type: "UNSELECT_ITEMS",
          payload: { destructionList: uuid, zaken: zakenToUnselect },
        });
      });
    };

    if (zakenToUnselectIncludesExcludedZaak) {
      confirm(
        "Weet u het zeker?",
        "U staat op het punt om de uitzondering ongedaan te maken. Wilt u doorgaan?",
        "Uitzondering ongedaan maken",
        "Annuleren",
        () => handleUnselectItems(zakenToUnselect),
      );
    } else {
      handleUnselectItems(zakenToUnselect);
    }
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

  return (
    <ListTemplate
      dataGridProps={dataGridProps}
      secondaryNavigationItems={[getSubmitDestructionListButton()]}
    >
      <DestructionListToolbar />
    </ListTemplate>
  );
}
