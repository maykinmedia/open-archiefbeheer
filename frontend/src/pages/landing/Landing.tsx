import { KanbanTemplate } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { KanbanCard } from "../../components/KanbanCard/KanbanCard";
import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { deslugify, timeAgo } from "../../lib/string";
import "./Landing.css";

const STATUS_LABELS: { [key: string]: string } = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUSES = ["pending", "in_progress", "completed"];

interface LandingLoaderReturn {
  [key: string]: DestructionList[];
}

export const landingLoader = async (): Promise<LandingLoaderReturn> => {
  const lists = await listDestructionLists();
  const statusMap: LandingLoaderReturn = {};

  // Initialize statusMap with empty arrays for each status
  STATUSES.forEach((status) => {
    statusMap[status] = [];
  });

  lists.forEach((list) => {
    if (!statusMap[list.status]) {
      statusMap[list.status] = [];
    }
    statusMap[list.status].push(list);
  });

  return statusMap;
};

export const Landing = () => {
  const lists = useLoaderData() as LandingLoaderReturn;

  const constructComponentList = (lists: DestructionList[]) => {
    const constructAssigneeNames = (
      assignees: DestructionList["assignees"],
    ) => {
      const sortedAssignees = assignees.sort((a, b) => a.order - b.order);
      const getName = (assignee: DestructionList["assignees"][0]["user"]) =>
        // If there's a first and last name, return the full name otherwise we return the username
        assignee.firstName && assignee.lastName
          ? `${assignee.firstName} ${assignee.lastName} (${assignee.role.name})`
          : `${assignee.username} (${assignee.role.name})`;
      return sortedAssignees.map((assignee) => getName(assignee.user));
    };
    return lists.map((list) => (
      <KanbanCard
        title={list.name}
        days={timeAgo(list.created)}
        assigneeNames={constructAssigneeNames(list.assignees)}
        href={`/destruction-list/${list.name}`}
        key={list.name}
      />
    ));
  };

  return (
    <KanbanTemplate
      kanbanProps={{
        title: "Landing Page",
        componentList: STATUSES.map((status) => ({
          title: STATUS_LABELS[status] || deslugify(status),
          items: constructComponentList(lists[status] || []),
        })),
      }}
    />
  );
};
