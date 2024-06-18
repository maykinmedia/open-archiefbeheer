import { AttributeData, FieldSet, KanbanTemplate } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import {
  IKanbanCardProps,
  KanbanCard,
} from "../../components/KanbanCard/KanbanCard";
import { User, whoAmI } from "../../lib/api/auth";
import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { loginRequired } from "../../lib/api/loginRequired";
import { timeAgo } from "../../lib/string";
import { STATUS_MAPPING } from "../destructionlist/detail/constants";
import "./Landing.css";

const STATUSES: FieldSet[] = [
  [
    STATUS_MAPPING.changes_requested,
    {
      fields: [],
      component: KanbanCard,
    },
  ],
  [
    STATUS_MAPPING.ready_to_review,
    {
      fields: [],
      component: KanbanCard,
    },
  ],
  [
    STATUS_MAPPING.ready_to_delete,
    {
      fields: [],
      component: KanbanCard,
    },
  ],
  [
    STATUS_MAPPING.deleted,
    {
      fields: [],
      component: KanbanCard,
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

  const constructAssigneeNames = (assignees: DestructionList["assignees"]) => {
    const sortedAssignees = assignees.sort((a, b) => a.order - b.order);
    const getName = (assignee: DestructionList["assignees"][0]["user"]) =>
      // If there's a first and last name, return the full name otherwise we return the username
      assignee.firstName && assignee.lastName
        ? `${assignee.firstName} ${assignee.lastName} (${assignee.role.name})`
        : `${assignee.username} (${assignee.role.name})`;
    return sortedAssignees.map((assignee) => getName(assignee.user));
  };

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

  const objectLists = Object.values(statusMap).map((lists) =>
    lists.map(
      (list) =>
        ({
          key: list.name,
          title: list.name,
          days: timeAgo(list.created),
          assigneeNames: constructAssigneeNames(list.assignees),
          href: constructHref(list),
        }) satisfies IKanbanCardProps & { key: string; href?: string },
    ),
  ) as unknown as AttributeData[][];

  return (
    <KanbanTemplate
      kanbanProps={{
        draggable: false,
        title: "Vernietigingslijsten",
        fieldsets: STATUSES,
        objectLists: objectLists,
      }}
    />
  );
};
