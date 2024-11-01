import { DestructionListAssignee } from "../lib/api/destructionLists";
import { beoordelaarFactory, recordManagerFactory } from "./user";

const defaultAssignees: DestructionListAssignee[] = [
  {
    user: recordManagerFactory(),
    role: "author",
  },
  {
    user: beoordelaarFactory(),
    role: "main_reviewer",
  },
];

export { defaultAssignees };
