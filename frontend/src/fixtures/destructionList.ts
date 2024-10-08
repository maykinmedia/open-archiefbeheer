import {
  DestructionList,
  DestructionListRead,
} from "../lib/api/destructionLists";
import { createObjectFactory } from "./factory";
import { defaultAssignees } from "./reviewers";
import { userFactory } from "./user";

const FIXTURE_DESTRUCTION_LIST: DestructionListRead = {
  pk: 1,
  uuid: "00000000-0000-0000-0000-000000000000",
  name: "My First Destruction List",
  author: userFactory(),
  containsSensitiveInfo: false,
  status: "changes_requested",
  processingStatus: "new",
  plannedDestructionDate: null,
  assignees: defaultAssignees,
  assignee: defaultAssignees[0].user,
  created: "2024-07-11T16:57",
  statusChanged: "2024-07-11:16:57",
};

const destructionListFactory = createObjectFactory<DestructionListRead>(
  FIXTURE_DESTRUCTION_LIST,
);

export { destructionListFactory };
