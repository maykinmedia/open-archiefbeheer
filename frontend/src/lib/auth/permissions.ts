import {
  STATUSES_ELIGIBLE_FOR_EDIT,
  STATUSES_ELIGIBLE_FOR_REVIEW,
} from "../../pages/constants";
import { User } from "../api/auth";
import { DestructionList } from "../api/destructionLists";

export type PermissionCheck = (user: User) => boolean;

export type DestructionListPermissionCheck = (
  user: User,
  destructionList: DestructionList,
) => boolean;

export const canChangeSettings: PermissionCheck = (user) => {
  // TODO: Functioneel beheerder in future
  return user.role.canStartDestruction;
};

/**
 * Returns whether `user` is allowed to create a new destruction list.
 * @param user
 */
export const canStartDestructionList: PermissionCheck = (user) =>
  user.role.canStartDestruction;

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
  if (!(user.role.canReviewDestruction || user.role.canReviewFinalList)) {
    return false;
  }

  if (!STATUSES_ELIGIBLE_FOR_REVIEW.includes(destructionList.status)) {
    return false;
  }

  return user.pk === destructionList.assignee.pk;
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

  if (!STATUSES_ELIGIBLE_FOR_REVIEW.includes(destructionList.status)) {
    return false;
  }

  return destructionList.assignees
    .filter((a) => a.role === "co_reviewer")
    .map((a) => a.user.pk)
    .includes(user.pk);
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
) =>
  (canStartDestructionList(user) ||
    canReviewDestructionList(user, destructionList)) &&
  (destructionList.status === "new" ||
    destructionList.status === "ready_to_review");

export const canRenameDestructionList: DestructionListPermissionCheck = (
  user,
  destructionList,
) => canStartDestructionList(user) && destructionList.status === "new";
