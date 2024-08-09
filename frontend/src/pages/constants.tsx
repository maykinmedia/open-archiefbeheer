import { BadgeProps, Outline } from "@maykin-ui/admin-ui";

import {
  DESTRUCTION_LIST_STATUSES,
  DestructionListStatus,
} from "../lib/api/destructionLists";
import { ProcessingStatus } from "../lib/api/processingStatus";
import { Review } from "../lib/api/review";

export const REVIEW_DECISION_MAPPING: Record<Review["decision"], string> = {
  accepted: "Goedgekeurd",
  rejected: "Afgewezen",
};

export const REVIEW_DECISION_LEVEL_MAPPING: Record<
  Review["decision"],
  BadgeProps["level"]
> = {
  accepted: "success",
  rejected: "danger",
};

export const STATUSES_ELIGIBLE_FOR_EDIT = ["changes_requested"];
export const STATUSES_ELIGIBLE_FOR_REVIEW: (typeof DESTRUCTION_LIST_STATUSES)[number][] =
  ["ready_to_review", "ready_for_archivist"];

export const STATUS_MAPPING: { [key in DestructionListStatus]: string } = {
  changes_requested: "Wijzigingen aangevraagd",
  ready_to_review: "Klaar om te beoordelen",
  ready_to_delete: "Klaar om te vernietigen",
  internally_reviewed: "Intern beoordeeld",
  ready_for_archivist: "Klaar voor archivaris",
  deleted: "Vernietigd",
};

export const STATUS_LEVEL_MAPPING: {
  [key in DestructionListStatus]: BadgeProps["level"];
} = {
  changes_requested: "warning",
  ready_to_review: "info",
  internally_reviewed: "info",
  ready_for_archivist: "success",
  ready_to_delete: "warning",
  deleted: "danger",
};

export const PROCESSING_STATUS_MAPPING: {
  [key in ProcessingStatus]: string;
} = {
  new: "new",
  queued: "queued",
  processing: "processing",
  failed: "failed",
  succeeded: "succeeded",
};

export const PROCESSING_STATUS_ICON_MAPPING: {
  [key in ProcessingStatus]: React.ReactNode;
} = {
  new: <Outline.PlusCircleIcon />,
  queued: <Outline.CircleStackIcon />,
  processing: <Outline.ClockIcon />,
  failed: <Outline.ExclamationCircleIcon />,
  succeeded: <Outline.CheckCircleIcon />,
};

export const PROCESSING_STATUS_LEVEL_MAPPING: {
  [key in ProcessingStatus]: BadgeProps["level"];
} = {
  new: "info",
  queued: "info",
  processing: "warning",
  failed: "danger",
  succeeded: "success",
};
