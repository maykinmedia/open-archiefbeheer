import { Badge, field2Title } from "@maykin-ui/admin-ui";
import React from "react";

import { ProcessingStatus } from "../../lib/api/processingStatus";
import { timeAgo } from "../../lib/format/date";
import {
  PROCESSING_STATUS_ICON_MAPPING,
  PROCESSING_STATUS_LEVEL_MAPPING,
  PROCESSING_STATUS_MAPPING,
} from "../../pages/constants";

type ProcessingStatusBadgeProps = {
  processingStatus: ProcessingStatus;
  plannedDestructionDate: string | null;
};

export const ProcessingStatusBadge: React.FC<ProcessingStatusBadgeProps> = ({
  processingStatus,
  plannedDestructionDate,
}) => {
  const getStatusText = () => {
    if (processingStatus === "new" && plannedDestructionDate) {
      return `Vernietigd ${timeAgo(plannedDestructionDate ?? "", { shortFormat: true })}`;
    }
    return field2Title(PROCESSING_STATUS_MAPPING[processingStatus], {
      unHyphen: false,
    });
  };
  return (
    <Badge level={PROCESSING_STATUS_LEVEL_MAPPING[processingStatus]}>
      {PROCESSING_STATUS_ICON_MAPPING[processingStatus]}
      {getStatusText()}
    </Badge>
  );
};
