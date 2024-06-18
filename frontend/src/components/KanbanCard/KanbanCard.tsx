import { Button, ButtonLink, Outline, P, Tooltip } from "@maykin-ui/admin-ui";
import { FC } from "react";

import "./KanbanCard.css";

export interface IKanbanCardProps {
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
    return <P>{assigneeNames[0]}</P>;
  };

  return (
    <div className="kanban-card">
      <div className="kanban-card__days-download">
        <P>{days}</P>
        {downloadUrl && (
          <ButtonLink variant="transparent" size="s" href={downloadUrl}>
            <Outline.ArrowDownIcon />
          </ButtonLink>
        )}
      </div>
      <div className="kanban-card__divider" />
      <P bold className="kanban-card__title">
        {title}
      </P>
      <div className="kanban-card__divider" />
      <div className="kanban-card__assignees">{renderAssignees()}</div>
    </div>
  );
};
