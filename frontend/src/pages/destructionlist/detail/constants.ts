import { BadgeProps } from "@maykin-ui/admin-ui";

import { DestructionListStatus } from "../../../lib/api/destructionLists";

export const STATUSES_ELIGIBLE_FOR_EDIT = ["changes_requested"];
export const STATUSES_ELIGIBLE_FOR_REVIEW = ["ready_to_review"];

export const STATUS_MAPPING: { [key in DestructionListStatus]: string } = {
  changes_requested: "Changes Requested",
  ready_to_review: "Ready to Review",
  ready_to_delete: "Ready to Destroy",
  internally_reviewed: "Internally reviewed",
  ready_for_archivist: "Ready for archivist",
  deleted: "Destroyed",
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
