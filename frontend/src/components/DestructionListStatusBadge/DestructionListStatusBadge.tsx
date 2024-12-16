import { Badge, ucFirst } from "@maykin-ui/admin-ui";
import React from "react";

import { DestructionList } from "../../lib/api/destructionLists";
import { STATUS_LEVEL_MAPPING, STATUS_MAPPING } from "../../pages/constants";

type DestructionListStatusBadgeProps = {
  destructionList: DestructionList;
};

export const DestructionListStatusBadge: React.FC<
  DestructionListStatusBadgeProps
> = ({ destructionList }) => {
  return (
    <Badge key="status" level={STATUS_LEVEL_MAPPING[destructionList.status]}>
      {ucFirst(STATUS_MAPPING[destructionList.status])}
    </Badge>
  );
};
