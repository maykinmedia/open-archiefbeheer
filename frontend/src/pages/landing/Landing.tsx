import { KanbanTemplate } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { KanbanCard } from "../../components/KanbanCard/KanbanCard";
import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { deslugify, timeAgo } from "../../lib/string";
import "./Landing.css";

interface LandingLoaderReturn {
  [key: string]: DestructionList[];
}

export const landingLoader = async (): Promise<LandingLoaderReturn> => {
  const lists = await listDestructionLists();
  const statusMap: LandingLoaderReturn = {};

  lists.forEach((list) => {
    if (!statusMap[list.status]) {
      statusMap[list.status] = [];
    }
    statusMap[list.status].push(list);
  });

  return statusMap;
};

// export const landingAction = async () => {
//   await createDestructionList();
//   return null;
// };

export const Landing = () => {
  const lists = useLoaderData() as LandingLoaderReturn;

  const constructComponentList = (lists: DestructionList[]) => {
    const constructAssigneeNames = (
      assignees: DestructionList["assignees"],
    ) => {
      const testAssignees = assignees.concat(assignees);
      const sortedAssignees = testAssignees.sort((a, b) => a.order - b.order);
      return sortedAssignees.map(
        (assignee) =>
          `${assignee.user.firstName} ${assignee.user.lastName} (${assignee.user.role.name})`,
      );
    };
    return lists.map((list) => (
      <KanbanCard
        title={list.name}
        days={timeAgo(list.created)}
        assigneeNames={constructAssigneeNames(list.assignees)}
        key={list.name}
      />
    ));
  };

  return (
    <KanbanTemplate
      kanbanProps={{
        title: "Landing Page",
        componentList: Object.keys(lists).map((status) => ({
          title: deslugify(status),
          items: constructComponentList(lists[status]),
        })),
      }}
    />
  );
};
