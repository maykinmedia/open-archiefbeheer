import { beoordelaarFactory, recordManagerFactory } from "./user";

const defaultAssignees = [
  {
    user: recordManagerFactory(),
    role: "record_manager",
  },
  {
    user: beoordelaarFactory(),
    role: "reviewer",
  },
];

export { defaultAssignees };
