import { AuditLogItem } from "../lib/api/auditLog";
import { formatUser } from "../lib/format/user";
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
  message: `[2023-09-15T21:36:00+02:00]: Destruction list "${destructionList.name}" created by user ${formatUser(recordManager)}.`,
  user: recordManager,
  extraData: {
    pk: destructionList.pk,
    name: destructionList.name,
    author: recordManager,
    minArchiefactiedatum: "2023-09-15T21:36:00+02:00",
    maxArchiefactiedatum: "2023-09-15T21:36:00+02:00",
    zaaktypen: [],
    resultaten: [],
    archiefnominaties: [],
    comment: "This is a comment",
    numberOfZaken: 123,
    assignees: [beoordelaarFactory(), procesEigenaarFactory()],
  },
};

export const auditLogItemFactory = createObjectFactory<AuditLogItem>(
  FIXTURE_AUDIT_LOG_ITEM,
);
export const auditLogFactory = createArrayFactory<AuditLogItem>([
  FIXTURE_AUDIT_LOG_ITEM,
]);
