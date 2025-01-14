import {
  DestructionList,
  DestructionListAssignee,
} from "../lib/api/destructionLists";
import { createArrayFactory, createObjectFactory } from "./factory";
import { defaultAssignees } from "./reviewers";
import { beoordelaarFactory, procesEigenaarFactory, userFactory } from "./user";

export const FIXTURE_DESTRUCTION_LIST: DestructionList = {
  pk: 1,
  uuid: "00000000-0000-0000-0000-000000000000",
  name: "My First Destruction List",
  author: userFactory(),
  comment: "This is a test destruction list.",
  containsSensitiveInfo: false,
  status: "changes_requested",
  processingStatus: "new",
  plannedDestructionDate: null,
  assignees: defaultAssignees,
  assignee: defaultAssignees[0].user,
  created: "2024-07-11T16:57",
  statusChanged: "2024-07-11:16:57",
  deletableItemsCount: 0,
};

export const destructionListFactory = createObjectFactory<DestructionList>(
  FIXTURE_DESTRUCTION_LIST,
);

const FIXTURE_DESTRUCTION_LIST_ASSIGNEE: DestructionListAssignee = {
  user: beoordelaarFactory(),
  role: "main_reviewer",
};

export const destructionListAssigneeFactory = createObjectFactory(
  FIXTURE_DESTRUCTION_LIST_ASSIGNEE,
);

const FIXTURE_DESTRUCTION_LIST_ASSIGNEES: DestructionListAssignee[] = [
  {
    user: beoordelaarFactory(),
    role: "main_reviewer",
  },
  {
    user: beoordelaarFactory(),
    role: "co_reviewer",
  },
  {
    user: procesEigenaarFactory(),
    role: "co_reviewer",
  },
];

export const destructionListAssigneesFactory = createArrayFactory(
  FIXTURE_DESTRUCTION_LIST_ASSIGNEES,
);
