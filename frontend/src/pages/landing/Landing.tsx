import {
  AttributeData,
  Badge,
  FieldSet,
  KanbanTemplate,
  P,
  Tooltip,
} from "@maykin-ui/admin-ui";
import { useLoaderData, useNavigate } from "react-router-dom";

import { User } from "../../lib/api/auth";
import { DestructionList } from "../../lib/api/destructionLists";
import {
  canMarkListAsFinal,
  canReviewDestructionList,
  canUpdateDestructionList,
} from "../../lib/auth/permissions";
import { timeAgo } from "../../lib/format/date";
import { STATUS_MAPPING } from "../destructionlist/detail/constants";
import { formatUser } from "../destructionlist/utils";
import "./Landing.css";
import { LandingContext } from "./Landing.loader";

export const STATUSES: FieldSet[] = [
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
  const navigate = useNavigate();
  const { statusMap, user } = useLoaderData() as LandingContext;

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
      case "changes_requested":
        return canUpdateDestructionList(user, list)
          ? `/destruction-lists/${list.uuid}`
          : undefined;

      case "ready_to_review":
      case "ready_for_archivist":
        return canReviewDestructionList(user, list)
          ? `/destruction-lists/${list.uuid}/review`
          : undefined;
      case "internally_reviewed":
        return canMarkListAsFinal(user, list)
          ? `/destruction-lists/${list.uuid}`
          : undefined;

      default:
        return undefined;
    }
  };

  const objectLists: AttributeData[][] = Object.values(statusMap).map((lists) =>
    lists.map((list) => {
      const currentAssignee = list.assignee;
      const otherAssignees = [...list.assignees].splice(1);
      const href = constructHref(user, list) || "";

      const footer = (
        <P muted size="xs">
          {formatUser(currentAssignee, true)}
          {otherAssignees.length && (
            <strong className="LandingPage__assignees-count">
              {" "}
              +{otherAssignees.length}
            </strong>
          )}
        </P>
      );

      return {
        key: list.name,
        onClick: () => navigate(href),
        disabled: !href,
        title: list.name,
        timeAgo: timeAgo(list.created),
        assignees: otherAssignees.length ? (
          <Tooltip
            content={otherAssignees
              .map((a) => formatUser(a.user, true))
              .join(", ")}
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
  return (
    <KanbanTemplate
      kanbanProps={{
        title: "Vernietigingslijsten",
        fieldsets: STATUSES,
        objectLists: objectLists,
        renderPreview: (object: AttributeData) => (
          <Badge>{object.timeAgo as string}</Badge>
        ),
      }}
    />
  );
};
