import { DestructionListAssigneeRead } from "../lib/api/destructionLists";
import { beoordelaarFactory, recordManagerFactory } from "./user";

const defaultAssignees: DestructionListAssigneeRead[] = [
  {
    user: recordManagerFactory(),
    role: "author",
  },
  {
    user: beoordelaarFactory(),
    role: "reviewer",
  },
];

export { defaultAssignees };
