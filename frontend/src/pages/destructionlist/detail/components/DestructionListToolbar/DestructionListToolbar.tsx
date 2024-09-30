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
} from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { ProcessingStatusBadge } from "../../../../../components";
import { formatDate } from "../../../../../lib/format/date";
import { formatUser } from "../../../../../lib/format/user";
import {
  REVIEW_DECISION_LEVEL_MAPPING,
  REVIEW_DECISION_MAPPING,
} from "../../../../constants";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { DestructionListAuditLog } from "../DestructionListAuditLog";
import { DestructionListReviewer } from "../index";

export type DestructionListToolbarProps = {
  title?: string;
};

/**
 * Toolbar on top of destruction list page providing meta information.
 * @constructor
 */
export function DestructionListToolbar({ title }: DestructionListToolbarProps) {
  const { destructionList, logItems, review, reviewers, reviewResponse } =
    useLoaderData() as DestructionListDetailContext;

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
                  <ProcessingStatusBadge
                    processingStatus={destructionList.processingStatus}
                    plannedDestructionDate={
                      destructionList.plannedDestructionDate
                    }
                  />
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

      {destructionList && reviewers && (
        <Column span={3}>
          <DestructionListReviewer
            destructionList={destructionList}
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
      {title ? (
        <H2>{title}</H2>
      ) : (
        destructionList && (
          <H2>{field2Title(destructionList.name, { unHyphen: false })}</H2>
        )
      )}
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
