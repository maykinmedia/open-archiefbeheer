import { Body, Button, P, Tooltip } from "@maykin-ui/admin-ui";
import { FC } from "react";

import "./KanbanCard.css";

interface IKanbanCardProps {
  title: string;
  days?: string;
  assigneeNames: string[];
  downloadUrl?: string;
}

export const KanbanCard: FC<IKanbanCardProps> = ({
  title,
  days,
  assigneeNames,
  downloadUrl, // TODO: Implement download button, not in API yet so unsure how to pass as props, will withold UI implementation until clarification
}) => {
  const renderAssignees = () => {
    if (assigneeNames.length > 1) {
      const [first, ...rest] = assigneeNames;
      return (
        <>
          <P>{first}</P>
          <Tooltip content={rest.join(", ")} placement={"top"}>
            <Button variant="transparent" pad={"h"}>
              <P bold>+{rest.length}</P>
            </Button>
          </Tooltip>
        </>
      );
    }
    return assigneeNames[0];
  };

  return (
    <Body className="kanban-card">
      <P>{days}</P>
      <div className="kanban-card__divider" />
      <P bold className="kanban-card__title">
        {title}
      </P>
      <div className="kanban-card__divider" />
      <div className="kanban-card__assignees">{renderAssignees()}</div>
    </Body>
  );
};
