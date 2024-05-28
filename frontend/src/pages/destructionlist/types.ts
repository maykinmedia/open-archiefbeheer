import { Assignee, User } from "../../lib/api/reviewers";
import { Zaak } from "../../types";
import { DestructionListCreateContext } from "./DestructionListCreate";

export type DestructionListItem = {
  zaak: string;
  status: string;
  zaakData: Zaak;
};

export type DestructionListData = {
  name: string;
  author: User;
  items: DestructionListItem[];
  containsSensitiveInfo: boolean;
  status: string;
  assignees: Assignee[];
  assignee: User;
  created: string;
  statusChanged: string;
};

export interface DestructionListDetailContext
  extends DestructionListCreateContext {
  destructionList: DestructionListData;
}

export type AssigneeUpdate = {
  user: number;
  order: number;
};

export type DestructionListUpdateData = {
  assignees?: AssigneeUpdate[];
};

export type AssigneeEditable = {
  user: User;
  order: number;
};

export type AssigneesEditableProps = {
  assignees: AssigneeEditable[];
};

export type AssigneesFormProps = {
  initialAssignees: AssigneeEditable[];
  onClose: () => void;
};
