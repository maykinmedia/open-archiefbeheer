import {
  DestructionList,
  DestructionListAssignee,
} from "../../../lib/api/destructionLists";
import { User } from "../../../lib/api/reviewers";
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
};

export type AssigneesFormProps = {
  initialAssignees: DestructionListAssignee[];
  onClose: () => void;
};
