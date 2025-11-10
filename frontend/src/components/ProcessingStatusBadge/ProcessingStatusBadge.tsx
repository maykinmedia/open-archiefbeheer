import { Badge, Outline } from "@maykin-ui/admin-ui";
import { string2Title } from "@maykin-ui/client-common";
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
  plannedDestructionDate?: string | null;
};

export const ProcessingStatusBadge: React.FC<ProcessingStatusBadgeProps> = ({
  processingStatus,
  plannedDestructionDate,
}) => {
  const getLevel = () => {
    if (processingStatus === "new" && plannedDestructionDate) {
      return "warning";
    }
    return PROCESSING_STATUS_LEVEL_MAPPING[processingStatus];
  };

  const getStatusIcon = () => {
    if (processingStatus === "new" && plannedDestructionDate) {
      return <Outline.ClockIcon />;
    }
    return PROCESSING_STATUS_ICON_MAPPING[processingStatus];
  };

  const getStatusText = () => {
    if (processingStatus === "new" && plannedDestructionDate) {
      const isPlannedDestructionDateInPast =
        new Date(plannedDestructionDate) < new Date();
      if (isPlannedDestructionDateInPast) {
        return `Wordt vernietigd`;
      }
      return `Wordt vernietigd ${timeAgo(plannedDestructionDate, { shortFormat: true, maxIntervals: 2 })}`;
    }
    return string2Title(PROCESSING_STATUS_MAPPING[processingStatus]);
  };

  return (
    <Badge level={getLevel()}>
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  );
};
