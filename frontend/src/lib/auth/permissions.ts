import {
  STATUSES_ELIGIBLE_FOR_EDIT,
  STATUSES_ELIGIBLE_FOR_REVIEW,
} from "../../pages/destructionlist/detail/constants";
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
 * Returns whether `user` is allowed to review `destructionList`.
 * @param user
 * @param destructionList
 */
export function canReviewDestructionList(
  user: User,
  destructionList: DestructionList,
) {
  if (!user.role.canReviewDestruction) {
    return false;
  }

  if (!STATUSES_ELIGIBLE_FOR_REVIEW.includes(destructionList.status)) {
    return false;
  }

  return user.pk === destructionList.assignee.pk;
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

  if (!STATUSES_ELIGIBLE_FOR_EDIT.includes(destructionList.status)) {
    return false;
  }

  return user.pk === destructionList.assignee.pk;
}

export function canViewDestructionList(
  user: User,
  destructionList: DestructionList,
) {
  return user.pk === destructionList.author.pk;
}

export function canMarkListAsFinal(
  user: User,
  destructionList: DestructionList,
) {
  return (
    user.pk === destructionList.author.pk &&
    destructionList.status === "internally_reviewed" &&
    user.role.canStartDestruction
  );
}
