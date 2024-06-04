import { AttributeData, FieldSet, KanbanTemplate } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { KanbanCard } from "../../components/KanbanCard/KanbanCard";
import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { timeAgo } from "../../lib/string";
import "./Landing.css";

const STATUS_LABELS: { [key: string]: string } = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUSES: FieldSet[] = [
  [
    STATUS_LABELS.pending,
    {
      fields: [],
      component: KanbanCard,
    },
  ],
  [
    STATUS_LABELS.in_progress,
    {
      fields: [],
      component: KanbanCard,
    },
  ],
  [
    STATUS_LABELS.completed,
    {
      fields: [],
      component: KanbanCard,
    },
  ],
];

interface LandingLoaderReturn {
  [key: string]: DestructionList[];
}

export const landingLoader = async (): Promise<LandingLoaderReturn> => {
  const lists = await listDestructionLists();

  // Initialize statusMap with empty arrays for each status
  const statusMap = STATUSES.reduce((acc, val) => {
    const status = val[0] || "";
    const destructionLists = lists.filter(
      (l) => STATUS_LABELS[l.status] === status,
    );
    return { ...acc, [status]: destructionLists };
  }, {});

  return statusMap;
};

export const Landing = () => {
  const lists = useLoaderData() as LandingLoaderReturn;

  const constructAssigneeNames = (assignees: DestructionList["assignees"]) => {
    const sortedAssignees = assignees.sort((a, b) => a.order - b.order);
    const getName = (assignee: DestructionList["assignees"][0]["user"]) =>
      // If there's a first and last name, return the full name otherwise we return the username
      assignee.firstName && assignee.lastName
        ? `${assignee.firstName} ${assignee.lastName} (${assignee.role.name})`
        : `${assignee.username} (${assignee.role.name})`;
    return sortedAssignees.map((assignee) => getName(assignee.user));
  };

  const objectLists = Object.values(lists).map((lists) =>
    lists.map((list) => ({
      key: list.name,
      title: list.name,
      days: timeAgo(list.created),
      assigneeNames: constructAssigneeNames(list.assignees),
      href: `/destruction-list/${list.pk}`,
    })),
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
