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
  useAlert,
  useFormDialog,
} from "@maykin-ui/admin-ui";
import { string2Title } from "@maykin-ui/client-common";
import { useEffect, useState } from "react";
import { useRevalidator } from "react-router-dom";

import { useDataFetcher } from "../../hooks/useDataFetcher";
import { listAuditLog } from "../../lib/api/auditLog";
import { whoAmI } from "../../lib/api/auth";
import {
  DestructionList,
  updateDestructionList,
} from "../../lib/api/destructionLists";
import { Review } from "../../lib/api/review";
import { getLatestReviewResponse } from "../../lib/api/reviewResponse";
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
  STATUSES_ELIGIBLE_FOR_CHANGING_ARCHIVIST,
  STATUSES_ELIGIBLE_FOR_CHANGING_REVIEWER,
} from "../../pages/constants";
import { DestructionListArchivist } from "../DestructionListArchivist/DestructionListArchivist";
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
  const { data: logItems } = useDataFetcher(
    (signal) => {
      if (!destructionList) return Promise.resolve([]);
      return listAuditLog(destructionList.uuid, undefined, signal);
    },
    {
      initialState: [],
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de audit log!",
    },
    [destructionList?.uuid],
  );

  const { data: logItemsReadyForReview } = useDataFetcher(
    (signal) => {
      if (!destructionList) return Promise.resolve([]);
      return listAuditLog(
        destructionList.uuid,
        "destruction_list_ready_for_first_review",
        signal,
      );
    },
    {
      initialState: [],
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de audit log!",
    },
    [destructionList?.uuid],
  );

  const { data: reviewResponse } = useDataFetcher(
    (signal) => {
      if (!review) return Promise.resolve(null);
      return getLatestReviewResponse({ review: review.pk }, signal);
    },
    {
      initialState: null,
      transform: (d) => d || null,
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de verwerkte beoordeling!",
    },
    [review?.pk],
  );
  const formDialog = useFormDialog();
  const alert = useAlert();
  const { data: user } = useDataFetcher(
    (signal) => whoAmI(signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de huidige gebruiker!",
      initialState: null,
    },
    [],
  );
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

  /*
  If the list already has a DestructionListAssignee with role archivist, then it must have already
  gone through the reviewer round. So it should not be possible to update the reviewer.
  */
  const destructionListHasArchivistAssigned =
    destructionList &&
    destructionList.assignees.find((assignee) => assignee.role == "archivist");

  const shouldShowReviewer =
    destructionList &&
    STATUSES_ELIGIBLE_FOR_CHANGING_REVIEWER.includes(destructionList.status) &&
    !destructionListHasArchivistAssigned;
  const shouldShowArchivist =
    destructionList &&
    STATUSES_ELIGIBLE_FOR_CHANGING_ARCHIVIST.includes(destructionList.status) &&
    destructionListHasArchivistAssigned;

  const properties = (
    <Body>
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
                  label: "Toelichting",
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

        {shouldShowReviewer && (
          <Column span={3}>
            <DestructionListReviewer destructionList={destructionList} />
          </Column>
        )}

        {shouldShowArchivist && (
          <Column span={3}>
            <DestructionListArchivist destructionList={destructionList} />
          </Column>
        )}

        {review && (
          <Column span={3}>
            <AttributeTable
              compact
              object={{
                "Laatste review door":
                  review.author && formatUser(review.author),
                Beoordeling: (
                  <Badge
                    variant={REVIEW_DECISION_LEVEL_MAPPING[review.decision]}
                  >
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
    </Body>
  );

  const fields = [
    {
      name: "name",
      type: "string",
      label: "Naam",
      defaultValue: destructionList?.name,
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
            string2Title(destructionList.name, { hyphens2Whitespace: false })}
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
        {logItemsReadyForReview?.length ? (
          <Tab id="details" label="Details">
            {!collapsedState && (
              <DestructionListAuditLogDetails
                logItem={[...logItemsReadyForReview].reverse()[0]}
              />
            )}
          </Tab>
        ) : null}
      </Tabs>
    </Body>
  );
}
