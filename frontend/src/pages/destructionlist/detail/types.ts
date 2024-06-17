import {
  DestructionList,
  DestructionListAssignee,
} from "../../../lib/api/destructionLists";
import { User } from "../../../lib/api/reviewers";
import { PaginatedZaken } from "../../../lib/api/zaken";

export interface DestructionListDetailContext {
  allZaken: PaginatedZaken;
  reviewers: User[];
  destructionList: DestructionList;
  storageKey: string;
}

export type AssigneesEditableProps = {
  assignees: DestructionListAssignee[];
};

export type AssigneesFormProps = {
  initialAssignees: DestructionListAssignee[];
  onClose: () => void;
};
