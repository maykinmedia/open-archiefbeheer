import { Badge, field2Title } from "@maykin-ui/admin-ui";
import React from "react";

import { ProcessingStatus } from "../lib/api/processingStatus";
import {
  PROCESSING_STATUS_ICON_MAPPING,
  PROCESSING_STATUS_LEVEL_MAPPING,
  PROCESSING_STATUS_MAPPING,
} from "./constants";

type ProcessingStatusBadgeProps = {
  processingStatus: ProcessingStatus;
};

export const ProcessingStatusBadge: React.FC<ProcessingStatusBadgeProps> = ({
  processingStatus,
}) => {
  return (
    <Badge level={PROCESSING_STATUS_LEVEL_MAPPING[processingStatus]}>
      {PROCESSING_STATUS_ICON_MAPPING[processingStatus]}
      &nbsp;
      {field2Title(PROCESSING_STATUS_MAPPING[processingStatus], {
        unHyphen: false,
      })}
    </Badge>
  );
};
