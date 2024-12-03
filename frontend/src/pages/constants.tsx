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
  ignored_review: "Herboordelen",
};

export const REVIEW_DECISION_LEVEL_MAPPING: Record<
  Review["decision"],
  BadgeProps["level"]
> = {
  accepted: "success",
  rejected: "danger",
  ignored_review: "info",
};

export const STATUSES_ELIGIBLE_FOR_EDIT = ["new", "changes_requested"];
export const STATUSES_ELIGIBLE_FOR_REVIEW: (typeof DESTRUCTION_LIST_STATUSES)[number][] =
  ["ready_to_review", "ready_for_archivist"];

export const STATUS_MAPPING: { [key in DestructionListStatus]: string } = {
  new: "nieuw",
  changes_requested: "wijzigingen aangevraagd",
  ready_to_review: "klaar voor beoordeling",
  ready_to_delete: "klaar om te vernietigen",
  internally_reviewed: "intern beoordeeld",
  ready_for_archivist: "klaar voor archivaris",
  deleted: "vernietigd",
};

export const STATUS_LEVEL_MAPPING: {
  [key in DestructionListStatus]: BadgeProps["level"];
} = {
  new: "success",
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
  new: "nieuw",
  queued: "in de wachtrij",
  processing: "verwerken",
  failed: "mislukt",
  succeeded: "succesvol",
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

export const FIELD_SELECTION_STORAGE_KEY = "field-selection-list";
