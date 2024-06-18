import { User } from "../../../lib/api/auth";
import {
  DestructionList,
  DestructionListAssignee,
} from "../../../lib/api/destructionLists";
import { PaginatedZaken } from "../../../lib/api/zaken";
import { ZaakSelection } from "../../../lib/zaakSelection/zaakSelection";

export interface DestructionListDetailContext {
  reviewers: User[];
  destructionList: DestructionList;
  storageKey: string;
  zaken: PaginatedZaken;
  allZaken: PaginatedZaken;
  zaakSelection: ZaakSelection;
}

export type AssigneesEditableProps = {
  assignees: DestructionListAssignee[];
  reviewers: User[];
};

export type AssigneesFormProps = {
  initialAssignees: DestructionListAssignee[];
  onClose: () => void;
};
