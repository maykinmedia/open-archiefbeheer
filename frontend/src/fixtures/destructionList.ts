import { DestructionList } from "../lib/api/destructionLists";
import { FIXTURE_USERS } from "./users";

export const FIXTURE_DESTRUCTION_LIST: DestructionList = {
  uuid: "00000000-0000-0000-0000-000000000000",
  name: "My First Destruction List",
  author: FIXTURE_USERS[0],
  containsSensitiveInfo: false,
  status: "in_progress",
  assignees: FIXTURE_USERS.map((u, i) => ({ user: u, order: i })),
  assignee: FIXTURE_USERS[0],
  created: "2024-07-11:16:57",
  statusChanged: "2024-07-11:16:57",
};
