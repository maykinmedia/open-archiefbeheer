import {
  AttributeData,
  Badge,
  FieldSet,
  KanbanTemplate,
  P,
  Tooltip,
} from "@maykin-ui/admin-ui";
import React from "react";
import { useLoaderData } from "react-router-dom";

import { User, whoAmI } from "../../lib/api/auth";
import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { loginRequired } from "../../lib/api/loginRequired";
import { timeAgo } from "../../lib/string";
import { STATUS_MAPPING } from "../destructionlist/detail/constants";
import { formatUser } from "../destructionlist/utils";
import "./Landing.css";

const STATUSES: FieldSet[] = [
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

interface LandingLoaderReturn {
  statusMap: { [key: string]: DestructionList[] };
  user: User | null;
}

export const landingLoader = loginRequired(
  async (): Promise<LandingLoaderReturn> => {
    const listsPromise = listDestructionLists();
    const userPromise = whoAmI();

    const [lists, user] = await Promise.all([listsPromise, userPromise]);
    // Initialize statusMap with empty arrays for each status
    const statusMap = STATUSES.reduce((acc, val) => {
      const status = val[0] || "";
      const destructionLists = lists.filter(
        (l) => STATUS_MAPPING[l.status] === status,
      );
      return { ...acc, [status]: destructionLists };
    }, {});

    return {
      statusMap,
      user,
    };
  },
);

export const Landing = () => {
  const { statusMap, user } = useLoaderData() as LandingLoaderReturn;

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
  const constructHref = (list: DestructionList): string | undefined => {
    const isAssignee = list.assignee.pk === user?.pk;

    switch (list.status) {
      case "changes_requested":
        return isAssignee ? `/destruction-lists/${list.uuid}` : undefined;

      case "ready_to_review":
        return isAssignee
          ? `/destruction-lists/${list.uuid}/review`
          : undefined;

      default:
        return undefined;
    }
  };

  const objectLists: AttributeData[][] = Object.values(statusMap).map((lists) =>
    lists.map((list) => {
      const firstAssignee = list.assignees[0];
      const otherAssignees = [...list.assignees].splice(1);

      const footer = (
        <P muted size="xs">
          {formatUser(firstAssignee.user)}
          {otherAssignees.length && <strong> +{otherAssignees.length}</strong>}
        </P>
      );

      return {
        key: list.name,
        href: constructHref(list),
        title: list.name,
        timeAgo: timeAgo(list.created),
        assignees: otherAssignees.length ? (
          <Tooltip
            content={otherAssignees.map((a) => formatUser(a.user)).join(", ")}
            placement="top"
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
