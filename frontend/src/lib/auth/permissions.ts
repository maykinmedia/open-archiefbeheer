import {
  STATUSES_ELIGIBLE_FOR_EDIT,
  STATUSES_ELIGIBLE_FOR_REVIEW,
} from "../../pages/constants";
import { User } from "../api/auth";
import { DestructionList } from "../api/destructionLists";

/**
 * Returns whether `user` is allowed to create a new destruction list.
 * @param user
 */
export function canStartDestructionList(user: User) {
  return user.role.canStartDestruction;
}

/**
 * Returns whether `user` is allowed to mark `destructionList` as ready to review.
 * @param user
 * @param destructionList
 */
export function canMarkAsReadyToReview(
  user: User,
  destructionList: DestructionList,
) {
  return (
    canStartDestructionList(user) &&
    (destructionList.status === "new" ||
      destructionList.status === "changes_requested")
  );
}

/**
 * Returns whether `user` is allowed to review `destructionList`.
 * @param user
 * @param destructionList
 */
export function canReviewDestructionList(
  user: User,
  destructionList: DestructionList,
) {
  if (!(user.role.canReviewDestruction || user.role.canReviewFinalList)) {
    return false;
  }

  if (!STATUSES_ELIGIBLE_FOR_REVIEW.includes(destructionList.status)) {
    return false;
  }

  return user.pk === destructionList.assignee.pk;
}

/**
 * Returns whether `user` is allowed to co-review `destructionList`.
 * @param user
 * @param destructionList
 */
export function canCoReviewDestructionList(
  user: User,
  destructionList: DestructionList,
) {
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
}

/**
 * Returns whether `user` is allowed to update `destructionList`.
 * @param user
 * @param destructionList
 */
export function canUpdateDestructionList(
  user: User,
  destructionList: DestructionList,
) {
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

  return user.pk === destructionList.assignee.pk;
}

export function canViewDestructionList(
  user: User,
  destructionList: DestructionList,
) {
  return (
    canStartDestructionList(user) ||
    canReviewDestructionList(user, destructionList) ||
    canCoReviewDestructionList(user, destructionList)
  );
}

export function canMarkListAsFinal(
  user: User,
  destructionList: DestructionList,
) {
  return (
    canStartDestructionList(user) &&
    destructionList.status === "internally_reviewed"
  );
}

export function canTriggerDestruction(
  user: User,
  destructionList: DestructionList,
) {
  return (
    canStartDestructionList(user) &&
    destructionList.status === "ready_to_delete"
  );
}

export function canReassignDestructionList(
  user: User,
  destructionList: DestructionList,
) {
  return (
    (canStartDestructionList(user) ||
      canReviewDestructionList(user, destructionList)) &&
    (destructionList.status === "new" ||
      destructionList.status === "ready_to_review")
  );
}

export function canChangeSettings(user: User) {
  // TODO: Functioneel beheerder in future
  return user.role.canStartDestruction;
}
