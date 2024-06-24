import { User } from "../../../lib/api/auth";
import {
  DestructionList,
  DestructionListAssignee,
} from "../../../lib/api/destructionLists";
import { Review, ReviewItem } from "../../../lib/api/review";
import { PaginatedZaken } from "../../../lib/api/zaken";
import { ZaakSelection } from "../../../lib/zaakSelection/zaakSelection";

export interface DestructionListDetailContext {
  storageKey: string;
  destructionList: DestructionList;
  reviewers: User[];
  zaken: PaginatedZaken;
  selectableZaken: PaginatedZaken;
  zaakSelection: ZaakSelection;
  review: Review | null;
  reviewItems: ReviewItem[] | null;
}

export type AssigneesEditableProps = {
  assignees: DestructionListAssignee[];
  reviewers: User[];
};

export type AssigneesFormProps = {
  initialAssignees: DestructionListAssignee[];
  onClose: () => void;
};
