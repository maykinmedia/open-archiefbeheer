// Todo: should this come from the backend?
import { BadgeProps } from "@maykin-ui/admin-ui";

export const STATUS_MAPPING: { [key: string]: string } = {
  in_progress: "In progress",
  processing: "Processing",
  completed: "Completed",
};

export const STATUS_LEVEL_MAPPING: { [key: string]: BadgeProps["level"] } = {
  in_progress: "warning",
  processing: "danger",
  completed: "success",
};
