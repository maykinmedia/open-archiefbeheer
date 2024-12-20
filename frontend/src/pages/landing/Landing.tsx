import {
  Badge,
  FieldSet,
  KanbanTemplate,
  Outline,
  P,
  Solid,
  Tooltip,
  string2Title,
} from "@maykin-ui/admin-ui";
import { useMemo } from "react";
import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom";

import { ProcessingStatusBadge } from "../../components/ProcessingStatusBadge";
import {
  useCombinedSearchParams,
  useRecordManagers,
  useReviewers,
  useUsers,
} from "../../hooks";
import { usePoll } from "../../hooks/usePoll";
import { User } from "../../lib/api/auth";
import {
  DESTRUCTION_LIST_STATUSES,
  DestructionList,
} from "../../lib/api/destructionLists";
import { ProcessingStatus } from "../../lib/api/processingStatus";
import {
  canCoReviewDestructionList,
  canMarkAsReadyToReview,
  canMarkListAsFinal,
  canReviewDestructionList,
  canStartDestructionList,
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

export const STATUSES: FieldSet<LandingKanbanEntry>[] = [
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
  const [searchParams, setSearchParams] = useCombinedSearchParams();
  const recordManagers = useRecordManagers();
  const reviewers = useReviewers();
  const users = useUsers();

  usePoll(async () => {
    const _statusMap = await getStatusMap(searchParams);
    const equal = JSON.stringify(_statusMap) === JSON.stringify(statusMap);
    if (!equal) {
      revalidator.revalidate();
    }
  }, []);

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
        return canReviewDestructionList(user, list) ||
          canCoReviewDestructionList(user, list)
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

  /**
   * Updates the search params when the user changes a filter/order input.
   * @param target
   */
  const handleFilter = ({
    target,
  }: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent) => {
    const { name, value } = target as HTMLInputElement;
    setSearchParams({ ...searchParams, [name]: value });
  };

  return (
    <KanbanTemplate<LandingKanbanEntry>
      kanbanProps={{
        title: "Vernietigingslijsten",
        fieldsets: STATUSES,
        objectLists: objectLists,
        toolbarProps: {
          items: [
            {
              icon: <Outline.MagnifyingGlassIcon />,
              name: "name",
              placeholder: "Zoeken…",
              title: "Zoeken",
              type: "search",
              value: searchParams.get("name") || "",
              onBlur: handleFilter,
              onKeyUp: (e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  handleFilter(e);
                }
              },
            },
            {
              icon: <Outline.DocumentIcon />,
              name: "status",
              options: useMemo(
                () =>
                  DESTRUCTION_LIST_STATUSES.map((status) => ({
                    label: string2Title(STATUS_MAPPING[status]),
                    value: status,
                  })),
                [],
              ),
              placeholder: "Status…",
              required: false,
              title: "Status",
              value: searchParams.get("status") || "",
              onChange: handleFilter,
            },
            {
              icon: <Outline.DocumentPlusIcon />,
              name: "author",
              options: useMemo(
                () => [
                  ...recordManagers.map((rm) => {
                    return {
                      label: formatUser(rm, { showUsername: false }),
                      value: rm.pk,
                    };
                  }),
                ],
                [recordManagers],
              ),
              placeholder: "Auteur…",
              required: false,
              title: "Auteur",
              value: searchParams.get("author") || "",
              onChange: handleFilter,
            },
            {
              icon: <Outline.DocumentArrowUpIcon />,
              name: "reviewer",
              options: useMemo(
                () => [
                  ...reviewers.map((rm) => {
                    return {
                      label: formatUser(rm, { showUsername: false }),
                      value: rm.pk,
                    };
                  }),
                ],
                [reviewers],
              ),
              placeholder: "Beoordelaar…",
              required: false,
              title: "Beoordelaar",
              value: searchParams.get("reviewer") || "",
              onChange: handleFilter,
            },
            {
              icon: <Outline.UserIcon />,
              name: "assignee",
              options: useMemo(
                () => [
                  ...users.map((rm) => {
                    return {
                      label: formatUser(rm, { showUsername: false }),
                      value: rm.pk,
                    };
                  }),
                ],
                [users],
              ),
              placeholder: "Toegewezen aan…",
              required: false,
              title: "Toegewezen aan",
              value: searchParams.get("assignee") || "",
              onChange: handleFilter,
            },
            {
              icon: <Outline.ChevronUpDownIcon />,
              direction: "horizontal",
              name: "ordering",
              options: [
                { label: "Nieuwste eerst", value: "-created" },
                { label: "Oudste eerst", value: "created" },
              ],
              required: true,
              title: "Sorteren",
              value: searchParams.get("ordering") || "-created",
              onChange: handleFilter,
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
              hidden: !canStartDestructionList(user),
              onClick: () => navigate("/destruction-lists/create"),
            },
          ],
        },
        renderPreview: (entry) => {
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
