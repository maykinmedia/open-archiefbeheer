import { BadgeProps } from "@maykin-ui/admin-ui";

import { DestructionListStatus } from "../../../lib/api/destructionLists";

export const STATUS_MAPPING: { [key in DestructionListStatus]: string } = {
  changes_requested: "Changes Requested",
  ready_to_review: "Ready to Review",
  ready_to_delete: "Ready to Destroy",
  deleted: "Destroyed",
};

export const STATUS_LEVEL_MAPPING: {
  [key in DestructionListStatus]: BadgeProps["level"];
} = {
  changes_requested: "warning",
  ready_to_review: "danger",
  ready_to_delete: "success",
  deleted: "info",
};
