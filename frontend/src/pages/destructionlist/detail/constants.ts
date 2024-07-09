import { BadgeProps } from "@maykin-ui/admin-ui";

import { DestructionListStatus } from "../../../lib/api/destructionLists";
import { Review } from "../../../lib/api/review";

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
export const STATUSES_ELIGABLE_FOR_REASSIGNMENT = ["internally_reviewed"];
export const STATUSES_ELIGIBLE_FOR_REVIEW = ["ready_to_review"];

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
  ready_to_review: "danger",
  internally_reviewed: "info",
  ready_for_archivist: "danger",
  ready_to_delete: "success",
  deleted: "info",
};
