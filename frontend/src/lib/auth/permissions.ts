import {
  STATUSES_ELIGIBLE_FOR_EDIT,
  STATUS_ELIGIBLE_TO_REASSIGN_LIST,
} from "../../pages/constants";
import { User } from "../api/auth";
import { DestructionList } from "../api/destructionLists";

export type PermissionCheck = (user: User) => boolean;

export type DestructionListPermissionCheck = (
  user: User,
  destructionList: DestructionList,
) => boolean;

export const canConfigureApplication: PermissionCheck = (user) => {
  return user.role.canConfigureApplication;
};

/**
 * Returns whether `user` is allowed to create a new destruction list.
 * @param user
 */
export const canStartDestructionList: PermissionCheck = (user) =>
  user.role.canStartDestruction;

/**
 * Returns whether `user` is allowed to delete `destructionList`.
 * @param user
 * @param destructionList
 */
export const canDeleteDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) => {
  if (!user.role.canStartDestruction) {
    return false;
  }
  return destructionList.status === "new";
};

/**
 * Returns whether `user` is allowed to mark `destructionList` as ready to review.
 * @param user
 * @param destructionList
 */
export const canMarkAsReadyToReview: DestructionListPermissionCheck = (
  user,
  destructionList,
) =>
  canStartDestructionList(user) &&
  (destructionList.status === "new" ||
    destructionList.status === "changes_requested");

/**
 * Returns whether `user` is allowed to review `destructionList`.
 * @param user
 * @param destructionList
 */
export const canReviewDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) => {
  if (user.pk !== destructionList.assignee.pk) {
    return false;
  }

  if (
    user.role.canReviewDestruction &&
    destructionList.status === "ready_to_review"
  ) {
    return true;
  }
  if (
    user.role.canReviewFinalList &&
    destructionList.status === "ready_for_archivist"
  ) {
    return true;
  }

  return false;
};

/**
 * Returns whether `user` is allowed to co-review `destructionList`.
 * @param user
 * @param destructionList
 */
export const canCoReviewDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) => {
  if (!user.role.canCoReviewDestruction) {
    return false;
  }

  if (destructionList.status !== "ready_to_review") {
    return false;
  }

  const listAssignees = destructionList.assignees
    .filter((a) => a.role === "co_reviewer")
    .map((a) => a.user.pk);
  if (listAssignees.includes(user.pk)) {
    return true;
  }

  return false;
};

/**
 * Returns whether `user` is allowed to update `destructionList`.
 * @param user
 * @param destructionList
 */
export const canUpdateDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) => {
  if (!user.role.canStartDestruction) {
    return false;
  }

  if (
    destructionList.status === "ready_to_delete" &&
    destructionList.plannedDestructionDate &&
    destructionList.processingStatus === "new"
  ) {
    return false;
  }

  if (!STATUSES_ELIGIBLE_FOR_EDIT.includes(destructionList.status)) {
    return false;
  }

  return true;
};

export const canViewDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) =>
  canStartDestructionList(user) ||
  canReviewDestructionList(user, destructionList) ||
  canCoReviewDestructionList(user, destructionList);

export const canMarkListAsFinal: DestructionListPermissionCheck = (
  user,
  destructionList,
) =>
  canStartDestructionList(user) &&
  destructionList.status === "internally_reviewed";

export const canTriggerDestruction: DestructionListPermissionCheck = (
  user,
  destructionList,
) =>
  canStartDestructionList(user) && destructionList.status === "ready_to_delete";

export const canReassignDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) => {
  return (
    canStartDestructionList(user) &&
    STATUS_ELIGIBLE_TO_REASSIGN_LIST.includes(destructionList.status)
  );
};

/**
 * @param user
 * @param destructionList
 */
export const canUpdateCoReviewers: DestructionListPermissionCheck = (
  user,
  destructionList,
) => {
  if (user.role.canStartDestruction) {
    return (
      destructionList.status === "new" ||
      destructionList.status === "ready_to_review"
    );
  }

  if (user.role.canReviewDestruction) {
    return destructionList.status === "ready_to_review";
  }

  return false;
};

export const canDownloadReport: DestructionListPermissionCheck = (
  user,
  destructionList,
) => {
  if (!user.role.canStartDestruction) {
    return false;
  }
  return (
    destructionList.status === "deleted" &&
    destructionList.processingStatus === "succeeded"
  );
};

export const canRenameDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) => canStartDestructionList(user) && destructionList.status === "new";
