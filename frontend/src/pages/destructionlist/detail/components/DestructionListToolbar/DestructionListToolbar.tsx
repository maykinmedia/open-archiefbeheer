import {
  AttributeTable,
  Badge,
  Body,
  Column,
  Grid,
  H2,
} from "@maykin-ui/admin-ui";
import React from "react";

import { User } from "../../../../../lib/api/auth";
import { DestructionList } from "../../../../../lib/api/destructionLists";
import { Review } from "../../../../../lib/api/review";
import { ReviewResponse } from "../../../../../lib/api/reviewResponse";
import { formatDate } from "../../../../../lib/format/date";
import { formatUser } from "../../../utils";
import {
  REVIEW_DECISION_LEVEL_MAPPING,
  REVIEW_DECISION_MAPPING,
  STATUS_LEVEL_MAPPING,
  STATUS_MAPPING,
} from "../../constants";
import { DestructionListAssignees } from "../index";

export type DestructionListToolbarProps = {
  destructionList: DestructionList;
  review?: Review | null;
  reviewers?: User[];
  reviewResponse?: ReviewResponse;
};

/**
 * Toolbar on top of destruction list page providing meta information.
 * @param destructionList
 * @param review
 * @param reviewers
 * @constructor
 */
export function DestructionListToolbar({
  destructionList,
  review,
  reviewers,
  reviewResponse,
}: DestructionListToolbarProps) {
  return (
    <Body>
      <H2>{destructionList.name}</H2>
      <Grid>
        <Column span={3}>
          <AttributeTable
            labeledObject={{
              auteur: {
                label: "Auteur",
                value: formatUser(destructionList.author),
              },
              bevatGevoeligeInformatie: {
                label: "Bevat gevoelige informatie",
                value: destructionList.containsSensitiveInfo,
              },
              status: {
                label: "Status",
                value: (
                  <Badge level={STATUS_LEVEL_MAPPING[destructionList.status]}>
                    {STATUS_MAPPING[destructionList.status]}
                  </Badge>
                ),
              },
              aangemaakt: {
                label: "Aangemaakt",
                value: formatDate(new Date(destructionList.created)),
              },
            }}
          />
        </Column>

        {reviewers && (
          <Column span={3}>
            <DestructionListAssignees
              assignees={destructionList.assignees}
              reviewers={reviewers}
            />
          </Column>
        )}

        {review && (
          <Column span={3}>
            <AttributeTable
              object={{
                "Laatste review door":
                  review.author && formatUser(review.author, true),
                Opmerking: review.listFeedback,
                Beoordeling: (
                  <Badge level={REVIEW_DECISION_LEVEL_MAPPING[review.decision]}>
                    {REVIEW_DECISION_MAPPING[review.decision]}
                  </Badge>
                ),
              }}
            />
          </Column>
        )}

        {reviewResponse && (
          <Column span={3}>
            <AttributeTable
              object={{
                "Laatst ingediend": formatDate(
                  new Date(String(reviewResponse.created)),
                ),
                Opmerking: reviewResponse.comment,
              }}
            />
          </Column>
        )}
      </Grid>
    </Body>
  );
}
