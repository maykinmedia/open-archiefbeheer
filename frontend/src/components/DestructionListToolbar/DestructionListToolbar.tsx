import {
  AttributeTable,
  Badge,
  Body,
  Column,
  Grid,
  H2,
  Tab,
  Tabs,
  string2Title,
  ucFirst,
} from "@maykin-ui/admin-ui";

import { useAuditLog, useLatestReviewResponse } from "../../hooks";
import { DestructionList } from "../../lib/api/destructionLists";
import { Review } from "../../lib/api/review";
import { formatDate } from "../../lib/format/date";
import { formatUser } from "../../lib/format/user";
import {
  REVIEW_DECISION_LEVEL_MAPPING,
  REVIEW_DECISION_MAPPING,
  STATUS_LEVEL_MAPPING,
  STATUS_MAPPING,
} from "../../pages/constants";
import {
  DestructionListAuditLogDetails,
  DestructionListAuditLogHistory,
} from "../DestructionListAuditLog";
import { DestructionListReviewer } from "../DestructionListReviewer";

export type DestructionListToolbarProps = {
  title?: string;
  destructionList?: DestructionList;
  review?: Review;
};

/**
 * Toolbar on top of destruction list page providing meta information.
 * @constructor
 */
export function DestructionListToolbar({
  title,
  destructionList,
  review,
}: DestructionListToolbarProps) {
  const logItems = useAuditLog(destructionList);
  const logItemsReadyForFirstReview = useAuditLog(
    destructionList,
    "destruction_list_ready_for_first_review",
  );
  const reviewResponse = useLatestReviewResponse(review);
  const properties = (
    <Grid>
      {destructionList && (
        <Column span={3}>
          <AttributeTable
            compact
            labeledObject={{
              auteur: {
                label: "Auteur",
                value: formatUser(destructionList.author),
              },
              toegewezen: {
                label: "Toegewezen aan",
                value: formatUser(destructionList.assignee),
              },
              toelichting: {
                label: "Comment",
                value: destructionList.comment,
              },
              // Commented out due to no actual implementation of specifying this.
              // bevatGevoeligeInformatie: {
              //   label: "Bevat gevoelige informatie",
              //   value: destructionList.containsSensitiveInfo,
              // },
              aangemaakt: {
                label: "Aangemaakt",
                value: formatDate(new Date(destructionList.created)),
              },
            }}
          />
        </Column>
      )}

      {destructionList && (
        <Column span={3}>
          <DestructionListReviewer destructionList={destructionList} />
        </Column>
      )}

      {review && (
        <Column span={3}>
          <AttributeTable
            compact
            object={{
              "Laatste review door": review.author && formatUser(review.author),
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
            compact
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
      {title ? (
        <H2>{title}</H2>
      ) : (
        destructionList && (
          <H2>{string2Title(destructionList.name, { unHyphen: false })}</H2>
        )
      )}
      <Tabs>
        <Tab id="gegevens" label="Gegevens">
          {properties}
        </Tab>
        {logItems?.length ? (
          <Tab id="geschiedenis" label="Geschiedenis">
            <DestructionListAuditLogHistory logItems={logItems} />
          </Tab>
        ) : null}
        {logItemsReadyForFirstReview?.length ? (
          <Tab id="details" label="Details">
            <DestructionListAuditLogDetails
              readyForFirstReviewLogItem={logItemsReadyForFirstReview[0]}
            />
          </Tab>
        ) : null}
      </Tabs>
    </Body>
  );
}
