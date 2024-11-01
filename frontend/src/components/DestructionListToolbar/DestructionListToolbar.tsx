import {
  AttributeTable,
  Badge,
  Body,
  Column,
  Grid,
  H2,
  Tab,
  Tabs,
  field2Title,
  ucFirst,
} from "@maykin-ui/admin-ui";

import {
  useAuditLog,
  useLatestReviewResponse,
  useReviewers,
} from "../../hooks";
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
import { DestructionListAuditLog } from "../DestructionListAuditLog";
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
  const reviewResponse = useLatestReviewResponse(review);
  const properties = (
    <Grid>
      {destructionList && (
        <Column span={3}>
          <AttributeTable
            labeledObject={{
              auteur: {
                label: "Auteur",
                value: formatUser(destructionList.author),
              },
              toegewezen: {
                label: "Toegewezen aan",
                value: formatUser(destructionList.assignee),
              },
              bevatGevoeligeInformatie: {
                label: "Bevat gevoelige informatie",
                value: destructionList.containsSensitiveInfo,
              },
              status: {
                label: "Status",
                value: (
                  <Badge level={STATUS_LEVEL_MAPPING[destructionList.status]}>
                    {ucFirst(STATUS_MAPPING[destructionList.status])}
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
      )}

      {destructionList && (
        <Column span={3}>
          <DestructionListReviewer destructionList={destructionList} />
        </Column>
      )}

      {review && (
        <Column span={3}>
          <AttributeTable
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
          <H2>{field2Title(destructionList.name, { unHyphen: false })}</H2>
        )
      )}
      {logItems?.length ? (
        <Tabs>
          <Tab id="gegevens" label="Gegevens">
            {properties}
          </Tab>
          <Tab id="geschiedenis" label="Geschiedenis">
            <DestructionListAuditLog destructionList={destructionList} />
          </Tab>
        </Tabs>
      ) : (
        properties
      )}
    </Body>
  );
}
