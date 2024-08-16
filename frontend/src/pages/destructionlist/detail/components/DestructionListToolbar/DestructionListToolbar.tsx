import {
  AttributeTable,
  Badge,
  Body,
  Column,
  Grid,
  H2,
  Tab,
  Tabs,
} from "@maykin-ui/admin-ui";
import React from "react";
import { useLoaderData } from "react-router-dom";

import { AuditLogItem } from "../../../../../lib/api/auditLog";
import { User } from "../../../../../lib/api/auth";
import { DestructionList } from "../../../../../lib/api/destructionLists";
import { Review } from "../../../../../lib/api/review";
import { ReviewResponse } from "../../../../../lib/api/reviewResponse";
import { formatDate } from "../../../../../lib/format/date";
import { formatUser } from "../../../../../lib/format/user";
import {
  REVIEW_DECISION_LEVEL_MAPPING,
  REVIEW_DECISION_MAPPING,
  STATUS_LEVEL_MAPPING,
  STATUS_MAPPING,
} from "../../../../constants";
import { DestructionListAuditLog } from "../DestructionListAuditLog";
import { DestructionListAssignees } from "../index";

/**
 * Toolbar on top of destruction list page providing meta information.
 * @constructor
 */
export function DestructionListToolbar() {
  const { destructionList, logItems, review, reviewers, reviewResponse } =
    useLoaderData() as {
      destructionList: DestructionList;
      logItems: AuditLogItem[];
      review: Review;
      reviewers: User[];
      reviewResponse?: ReviewResponse;
    };

  const properties = (
    <Grid>
      <Column span={3}>
        <AttributeTable
          labeledObject={{
            auteur: {
              label: "Auteur",
              value: formatUser(destructionList.author),
            },
            toegewezen: {
              label: "Toegewezen aan",
              value: destructionList.assignee
                ? formatUser(destructionList.assignee)
                : "-",
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
                review.author && formatUser(review.author, { showRole: true }),
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
  );

  return (
    <Body>
      <H2>{destructionList.name}</H2>
      {logItems ? (
        <Tabs>
          <Tab id="gegevens" label="Gegevens">
            {properties}
          </Tab>
          <Tab id="geschiedenis" label="Geschiedenis">
            <DestructionListAuditLog />
          </Tab>
        </Tabs>
      ) : (
        properties
      )}
    </Body>
  );
}
