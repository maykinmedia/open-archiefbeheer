import { AttributeTable, Badge, Solid, Tooltip } from "@maykin-ui/admin-ui";
import { JSX, useMemo } from "react";

import { DestructionListItem } from "../lib/api/destructionListsItem";
import { ZaakSelection } from "../lib/zaakSelection";
import { Zaak } from "../types";
import {
  ZAAK_REVIEW_STATUS_ENUM,
  useZaakReviewStatuses,
} from "./useZaakReviewStatuses";

/**
 * Returns `object` with appropriate Badge element and `ZAAK_REVIEW_STATUS_ENUM` for each zaak in `zakenOnPage`.
 * @param destructionListItems
 * @param reviewedZaakSelectionOnPage
 * @param reviewAdviceIgnoredResults
 */
export function useZaakReviewStatusBadges(
  destructionListItems: DestructionListItem[],
  reviewedZaakSelectionOnPage: ZaakSelection<{
    approved: boolean;
    comment: string;
  }>,
  reviewAdviceIgnoredResults: Record<string, boolean>, // Map of reviewAdviceIgnored
): Record<string, { badge: JSX.Element; status: ZAAK_REVIEW_STATUS_ENUM }> {
  const filteredDestructionListItems = useMemo(
    () =>
      destructionListItems.filter(
        (destructionListItem) => destructionListItem.zaak,
      ),
    [destructionListItems],
  );

  const zaken = filteredDestructionListItems.map(
    (destructionListItem) => destructionListItem.zaak as Zaak,
  );

  const statuses = useZaakReviewStatuses(
    filteredDestructionListItems.map(
      (destructionListItem) => destructionListItem.zaak as Zaak,
    ),
    reviewedZaakSelectionOnPage,
  );

  return useMemo(() => {
    const badges = zaken.map((zaak) => {
      const status = statuses[zaak.url as string];
      const reviewAdviceIgnored =
        reviewAdviceIgnoredResults[zaak.url as string];

      if (typeof status === "boolean") {
        if (status) {
          return (
            <Badge
              key={zaak.uuid}
              variant="success"
              style={{ display: "block" }}
            >
              <Solid.HandThumbUpIcon /> Geaccordeerd
            </Badge>
          );
        } else {
          return (
            <Badge
              key={zaak.uuid}
              variant="danger"
              style={{ display: "block" }}
            >
              <Solid.HandThumbDownIcon /> Uitgezonderd
            </Badge>
          );
        }
      } else if (reviewAdviceIgnored) {
        // Display "Herboordelen" badge for reviewAdviceIgnored zaken
        return (
          <Badge key={zaak.uuid} variant="info" style={{ display: "block" }}>
            <Solid.ArrowPathRoundedSquareIcon /> Herboordelen
          </Badge>
        );
      } else {
        return (
          <Badge key={zaak.uuid} style={{ display: "block" }}>
            <Solid.QuestionMarkCircleIcon /> Niet beoordeeld
          </Badge>
        );
      }
    });

    const entries = filteredDestructionListItems.map(
      (destructionListItem, i) => {
        const zaak = destructionListItem.zaak as Zaak;
        const tableContent = Object.fromEntries(
          Object.entries({
            "Opmerking (opsteller)": destructionListItem.reviewResponseComment,
            "Opmerking ((mede)beoordelaar)":
              reviewedZaakSelectionOnPage[zaak.url as string]?.detail?.comment,
          }).filter(([, v]) => v),
        );
        const hasComments = Boolean(Object.keys(tableContent).length);

        return [
          zaak.url as string,
          {
            badge: hasComments ? (
              <Tooltip
                content={<AttributeTable compact object={tableContent} wrap />}
              >
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                <span tabIndex={0}>{badges[i]}</span>
              </Tooltip>
            ) : (
              badges[i]
            ),
            status: statuses[zaak.url as string],
          },
        ];
      },
    );
    return Object.fromEntries(entries);
  }, [statuses, reviewAdviceIgnoredResults, destructionListItems]);
}
