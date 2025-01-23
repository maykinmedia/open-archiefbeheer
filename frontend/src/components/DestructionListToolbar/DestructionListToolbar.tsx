import {
  AttributeTable,
  Badge,
  Body,
  Button,
  Column,
  Grid,
  H2,
  SerializedFormData,
  Solid,
  Tab,
  Tabs,
  string2Title,
  useAlert,
  useFormDialog,
} from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";
import { useRevalidator } from "react-router-dom";

import { useAuditLog, useLatestReviewResponse, useWhoAmI } from "../../hooks";
import {
  DestructionList,
  updateDestructionList,
} from "../../lib/api/destructionLists";
import { Review } from "../../lib/api/review";
import { canRenameDestructionList } from "../../lib/auth/permissions";
import { formatDate } from "../../lib/format/date";
import { collectErrors } from "../../lib/format/error";
import { formatUser } from "../../lib/format/user";
import {
  getPreference,
  setPreference,
} from "../../lib/preferences/preferences";
import {
  REVIEW_DECISION_LEVEL_MAPPING,
  REVIEW_DECISION_MAPPING,
} from "../../pages/constants";
import {
  DestructionListAuditLogDetails,
  DestructionListAuditLogHistory,
} from "../DestructionListAuditLog";
import { DestructionListReviewer } from "../DestructionListReviewer";

export type DestructionListToolbarProps = {
  destructionList?: DestructionList;
  title?: string;
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
  const formDialog = useFormDialog();
  const alert = useAlert();
  const user = useWhoAmI();
  const revalidator = useRevalidator();
  const [tabIndexState, setTabIndexState] = useState(0);
  const [collapsedState, setCollapsedState] = useState<boolean | null>(null);

  // Get collapsed state from preferences
  useEffect(() => {
    getPreference<boolean>("destructionListToolbarCollapsed").then(
      (collapsed) => setCollapsedState(Boolean(collapsed)),
    );
  }, []);

  // Update collapsed state in preferences
  useEffect(() => {
    // Skip initial run.
    if (typeof collapsedState !== "boolean") {
      return;
    }
    setPreference<boolean>("destructionListToolbarCollapsed", collapsedState);
  }, [collapsedState]);

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

  const fields = [
    {
      name: "name",
      type: "string",
      label: "Naam",
      value: destructionList?.name,
    },
  ];

  const handleTabChange = (newTabIndex: number) => {
    if (!collapsedState && tabIndexState === newTabIndex) {
      setCollapsedState(true);
    } else {
      setCollapsedState(false);
    }
    setTabIndexState(newTabIndex);
  };

  const handleSubmit = (data: SerializedFormData) => {
    if (!destructionList) {
      return;
    }
    updateDestructionList(destructionList.uuid, data)
      .catch(async (e) => {
        console.error(e);
        try {
          const data = await e.json();
          const errors = collectErrors(data).join("\n");
          alert("Foutmelding", data.detail || errors, "Ok");
        } catch {
          alert(
            "Foutmelding",
            "Er is een fout opgetreden bij het bewerken van de naam van de vernietigingslijst.",
            "Ok",
          );
          return;
        }
      })
      .then(() => {
        revalidator.revalidate();
      });
  };

  return (
    <Body className="destruction-list-toolbar">
      <H2>
        {title
          ? title
          : destructionList &&
            string2Title(destructionList.name, { unHyphen: false })}
        {user &&
          destructionList &&
          canRenameDestructionList(user, destructionList) && (
            <>
              &nbsp;
              <Button
                aria-label="Naam bewerken"
                //   disabled={state === "loading" || state === "submitting"}
                size="xs"
                variant="secondary"
                onClick={() => {
                  formDialog(
                    "Naam bewerken",
                    null,
                    fields,
                    "Opslaan",
                    "Annuleren",
                    handleSubmit,
                    undefined,
                    { allowClose: true },
                    { showRequiredExplanation: false },
                  );
                }}
              >
                <Solid.PencilIcon />
              </Button>
            </>
          )}
      </H2>
      <Tabs onTabChange={handleTabChange}>
        <Tab id="gegevens" label="Gegevens">
          {!collapsedState && properties}
        </Tab>
        {logItems?.length ? (
          <Tab id="geschiedenis" label="Geschiedenis">
            {!collapsedState && (
              <DestructionListAuditLogHistory logItems={logItems} />
            )}
          </Tab>
        ) : null}
        {logItemsReadyForFirstReview?.length ? (
          <Tab id="details" label="Details">
            {!collapsedState && (
              <DestructionListAuditLogDetails
                readyForFirstReviewLogItem={logItemsReadyForFirstReview[0]}
              />
            )}
          </Tab>
        ) : null}
      </Tabs>
    </Body>
  );
}
