import { AuditLogItem } from "../lib/api/auditLog";
import { destructionListFactory } from "./destructionList";
import { createArrayFactory, createObjectFactory } from "./factory";
import {
  beoordelaarFactory,
  procesEigenaarFactory,
  recordManagerFactory,
} from "./user";

const destructionList = destructionListFactory();
const recordManager = recordManagerFactory();

export const FIXTURE_AUDIT_LOG_ITEM: AuditLogItem = {
  pk: 1,
  timestamp: "2023-09-15T21:36:00+02:00",
  message: `[2023-09-15T21:36:00+02:00]: Destruction list "${destructionList.name}" created by user ${recordManager}.`,
  user: recordManager,
  extraData: {
    pk: destructionList.pk,
    name: destructionList.name,
    author: recordManager,
    assignees: [beoordelaarFactory(), procesEigenaarFactory()],
  },
};

export const auditLogItemFactory = createObjectFactory(FIXTURE_AUDIT_LOG_ITEM);
export const auditLogFactory = createArrayFactory([FIXTURE_AUDIT_LOG_ITEM]);
