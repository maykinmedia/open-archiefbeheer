import {
  AttributeData,
  Badge,
  FieldSet,
  KanbanTemplate,
  Outline,
  P,
  Solid,
  Tooltip,
} from "@maykin-ui/admin-ui";
import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom";

import { ProcessingStatusBadge } from "../../components/ProcessingStatusBadge";
import { usePoll } from "../../hooks/usePoll";
import { User } from "../../lib/api/auth";
import { DestructionList } from "../../lib/api/destructionLists";
import { ProcessingStatus } from "../../lib/api/processingStatus";
import {
  canMarkAsReadyToReview,
  canMarkListAsFinal,
  canReviewDestructionList,
  canTriggerDestruction,
  canUpdateDestructionList,
  canViewDestructionList,
} from "../../lib/auth/permissions";
import { timeAgo } from "../../lib/format/date";
import { formatUser } from "../../lib/format/user";
import { STATUS_MAPPING } from "../constants";
import "./Landing.css";
import { LandingContext, getStatusMap } from "./Landing.loader";

export type LandingKanbanEntry = {
  key: string;
  onClick: () => void;
  disabled: boolean;
  plannedDestructionDate: string | null;
  processingStatus: ProcessingStatus;
  title: string;
  timeAgo: string;
  assignees: React.ReactNode;
};

export const STATUSES: FieldSet[] = [
  [
    STATUS_MAPPING.new,
    {
      fields: ["assignees"],
    },
  ],
  [
    STATUS_MAPPING.changes_requested,
    {
      fields: ["assignees"],
    },
  ],
  [
    STATUS_MAPPING.ready_to_review,
    {
      fields: ["assignees"],
    },
  ],
  [
    STATUS_MAPPING.internally_reviewed,
    {
      fields: ["assignees"],
    },
  ],
  [
    STATUS_MAPPING.ready_for_archivist,
    {
      fields: ["assignees"],
    },
  ],
  [
    STATUS_MAPPING.ready_to_delete,
    {
      fields: ["assignees"],
    },
  ],
  [
    STATUS_MAPPING.deleted,
    {
      fields: ["assignees"],
    },
  ],
];

export const Landing = () => {
  const { statusMap, user } = useLoaderData() as LandingContext;
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  usePoll(async () => {
    const orderQuery = new URLSearchParams(window.location.search).get(
      "ordering",
    );
    const _statusMap = await getStatusMap(orderQuery);
    const equal = JSON.stringify(_statusMap) === JSON.stringify(statusMap);
    if (!equal) {
      revalidator.revalidate();
    }
  });

  /**
   * Determines the href for a given destruction list based on its status and the user's role.
   *
   * Status and behavior:
   * - "Changes Requested":
   *   - If the user is the assignee of the list -> detail page.
   *   - Any other case -> undefined.
   * - "Ready For Review":
   *   - If the user is the assignee of the list -> review page.
   *   - If the user is not the assignee of the list -> undefined.
   * - "Ready for Destruction":
   *   - undefined.
   * - "Destroyed":
   *   - undefined.
   */
  const constructHref = (
    user: User,
    list: DestructionList,
  ): string | undefined => {
    switch (list.status) {
      case "new":
        return canMarkAsReadyToReview(user, list) ||
          canUpdateDestructionList(user, list)
          ? `/destruction-lists/${list.uuid}`
          : undefined;
      case "changes_requested":
        return canUpdateDestructionList(user, list)
          ? `/destruction-lists/${list.uuid}`
          : undefined;

      case "ready_to_review":
      case "ready_for_archivist":
        return canReviewDestructionList(user, list)
          ? `/destruction-lists/${list.uuid}/review`
          : canViewDestructionList(user, list)
            ? `/destruction-lists/${list.uuid}`
            : undefined;

      case "internally_reviewed":
        return canMarkListAsFinal(user, list)
          ? `/destruction-lists/${list.uuid}`
          : undefined;

      case "ready_to_delete":
        return canTriggerDestruction(user, list)
          ? `/destruction-lists/${list.uuid}`
          : undefined;

      default:
        return undefined;
    }
  };

  const objectLists = Object.values(statusMap).map((lists: DestructionList[]) =>
    lists.map<LandingKanbanEntry>((list) => {
      const currentAssignee = list.assignee;
      const otherAssignees = [...list.assignees].splice(1);
      const href = constructHref(user, list) || "";

      const footer = (
        <P muted size="xs">
          <Outline.UserIcon />
          &nbsp;
          {formatUser(currentAssignee, {
            showUsername: false,
          })}
          {otherAssignees.length && (
            <strong className="LandingPage__assignees-count">
              &nbsp; +{otherAssignees.length}
            </strong>
          )}
        </P>
      );

      return {
        key: list.name,
        onClick: () => navigate(href),
        disabled: !href,
        processingStatus: list.processingStatus,
        plannedDestructionDate: list.plannedDestructionDate,
        title: list.name,
        timeAgo: timeAgo(list.created),
        assignees: otherAssignees.length ? (
          <Tooltip
            content={otherAssignees.map((a) => formatUser(a.user)).join(", ")}
            placement="bottom"
          >
            <span>{footer}</span>
          </Tooltip>
        ) : (
          footer
        ),
      };
    }),
  );

  const sortOptions = [
    { label: "Nieuwste eerst", value: "-created" },
    { label: "Oudste eerst", value: "created" },
  ];

  const selectedSort =
    new URLSearchParams(window.location.search).get("ordering") || "-created";

  const sortedOptions = sortOptions.map((option) => ({
    ...option,
    selected: option.value === selectedSort,
  }));

  const onChangeSort = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // update the query string
    navigate(`?ordering=${event.target.value}`);
  };

  return (
    <KanbanTemplate
      kanbanProps={{
        title: "Vernietigingslijsten",
        fieldsets: STATUSES,
        objectLists: objectLists,
        toolbarProps: {
          items: [
            {
              direction: "horizontal",
              label: "Sorteren",
              required: true,
              options: sortedOptions,
              onChange: onChangeSort,
            },
            "spacer",
            {
              children: (
                <>
                  <Solid.DocumentPlusIcon />
                  Vernietigingslijst opstellen
                </>
              ),
              size: "xs",
              variant: "primary",
              onClick: () => navigate("/destruction-lists/create"),
            },
          ],
        },
        renderPreview: (object: AttributeData) => {
          const entry = object as LandingKanbanEntry;

          if (
            entry.processingStatus === "new" &&
            !entry.plannedDestructionDate
          ) {
            return (
              <Badge aria-label="opgesteld">
                <Outline.DocumentPlusIcon />
                {entry.timeAgo as string}
              </Badge>
            );
          }
          return (
            <ProcessingStatusBadge
              processingStatus={entry.processingStatus}
              plannedDestructionDate={entry.plannedDestructionDate}
            />
          );
        },
      }}
    />
  );
};
