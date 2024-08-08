import { DestructionList } from "../lib/api/destructionLists";
import { createObjectFactory } from "./factory";
import { userFactory, usersFactory } from "./user";

const FIXTURE_DESTRUCTION_LIST: DestructionList = {
  pk: 1,
  uuid: "00000000-0000-0000-0000-000000000000",
  name: "My First Destruction List",
  author: userFactory(),
  containsSensitiveInfo: false,
  status: "changes_requested",
  processingStatus: "new",
  assignees: usersFactory().map((u, i) => ({
    user: u,
    order: i,
    role: "reviewer",
  })),
  assignee: userFactory(),
  created: "2024-07-11T16:57",
  statusChanged: "2024-07-11:16:57",
};

const destructionListFactory = createObjectFactory<DestructionList>(
  FIXTURE_DESTRUCTION_LIST,
);

export { destructionListFactory };
