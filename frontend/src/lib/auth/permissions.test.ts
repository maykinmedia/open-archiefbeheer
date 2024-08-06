import { destructionListFactory } from "../../fixtures/destructionList";
import { roleFactory, userFactory } from "../../fixtures/user";
import {
  STATUSES_ELIGIBLE_FOR_EDIT,
  STATUSES_ELIGIBLE_FOR_REVIEW,
} from "../../pages/constants";
import { User } from "../api/auth";
import {
  DESTRUCTION_LIST_STATUSES,
  DestructionList,
} from "../api/destructionLists";
import {
  canMarkListAsFinal,
  canReviewDestructionList,
  canStartDestructionList,
  canUpdateDestructionList,
  canViewDestructionList,
} from "./permissions";

describe("canReviewDestructionList()", () => {
  test("canReviewDestructionList() returns false if user has no appropriate role", () => {
    const me = userFactory({
      pk: 1,
      role: roleFactory({
        canReviewDestruction: false,
        canReviewFinalList: false,
      }),
    });

    const list = destructionListFactory({
      assignee: me,
      status: "ready_to_review",
    });

    expect(canReviewDestructionList(me, list)).toBeFalsy();
  });
  test("canReviewDestructionList() returns false if list has no appropriate status", () => {
    const me = userFactory({
      pk: 1,
      role: roleFactory({
        canReviewDestruction: true,
        canReviewFinalList: true,
      }),
    });

    const list = destructionListFactory({
      assignee: me,
      status: "changes_requested",
    });

    expect(canReviewDestructionList(me, list)).toBeFalsy();
  });

  test("canReviewDestructionList() returns false if user is assignee", () => {
    const me = userFactory({
      pk: 1,
      role: roleFactory({
        canReviewDestruction: true,
        canReviewFinalList: true,
      }),
    });

    const other = userFactory({
      pk: 2,
      role: roleFactory({
        canReviewDestruction: true,
        canReviewFinalList: true,
      }),
    });

    const list = destructionListFactory({
      assignee: other,
      status: "ready_to_review",
    });

    expect(canReviewDestructionList(me, list)).toBeFalsy();
  });

  test("canReviewDestructionList() returns true", () => {
    const me = userFactory({
      pk: 1,
      role: roleFactory({
        canReviewDestruction: true,
        canReviewFinalList: false,
      }),
    });

    const other = userFactory({
      pk: 2,
      role: roleFactory({
        canReviewDestruction: false,
        canReviewFinalList: true,
      }),
    });

    const list1 = destructionListFactory({
      assignee: me,
      status: "ready_to_review",
    });
    const list2 = destructionListFactory({
      assignee: other,
      status: "ready_to_review",
    });

    expect(canReviewDestructionList(me, list1)).toBeTruthy();
    expect(canReviewDestructionList(other, list2)).toBeTruthy();
  });
});

DESTRUCTION_LIST_STATUSES.forEach((status) => {
  describe(`canStartDestructionList() with destruction list status: ${status}`, () => {
    let destructionList: DestructionList;
    let user: User;

    beforeEach(() => {
      user = userFactory({
        role: { canStartDestruction: true, canReviewDestruction: true },
      });
      destructionList = destructionListFactory({
        status,
        assignee: user,
        author: user,
      });
    });

    test("should allow a user with the canStartDestruction role", () => {
      expect(canStartDestructionList(user)).toBe(true);
    });

    test("should not allow a user without the canStartDestruction role", () => {
      user = userFactory({
        role: { canStartDestruction: false, canReviewDestruction: true },
      });
      expect(canStartDestructionList(user)).toBe(false);
    });
  });

  describe(`canReviewDestructionList() with destruction list status: ${status}`, () => {
    let destructionList: DestructionList;
    let user: User;
    let anotherUser: User;

    beforeEach(() => {
      user = userFactory({
        role: { canStartDestruction: true, canReviewDestruction: true },
      });
      anotherUser = { ...user, pk: 2 };
      destructionList = destructionListFactory({
        status,
        assignee: user,
        author: user,
      });
    });

    test("should allow a user to review if they have the role and status is eligible", () => {
      const isEligible = STATUSES_ELIGIBLE_FOR_REVIEW.includes(status);
      expect(canReviewDestructionList(user, destructionList)).toBe(isEligible);
    });

    test("should not allow a user to review if they lack the role", () => {
      user = userFactory({
        role: { canStartDestruction: true, canReviewDestruction: false },
      });
      expect(canReviewDestructionList(user, destructionList)).toBe(false);
    });

    test("should not allow a user to review if they are not the assignee", () => {
      destructionList.assignee = anotherUser;
      expect(canReviewDestructionList(user, destructionList)).toBe(false);
    });
  });

  describe(`canUpdateDestructionList() with destruction list status: ${status}`, () => {
    let destructionList: DestructionList;
    let user: User;
    let anotherUser: User;

    beforeEach(() => {
      user = userFactory({
        role: { canStartDestruction: true, canReviewDestruction: true },
      });
      anotherUser = { ...user, pk: 2 };
      destructionList = destructionListFactory({
        status,
        assignee: user,
        author: user,
      });
    });

    test("should allow a user to update if they have the role and status is eligible", () => {
      const isEligible = STATUSES_ELIGIBLE_FOR_EDIT.includes(status);
      expect(canUpdateDestructionList(user, destructionList)).toBe(isEligible);
    });

    test("should not allow a user to update if they lack the role", () => {
      user = userFactory({
        role: { canStartDestruction: false, canReviewDestruction: true },
      });
      expect(canUpdateDestructionList(user, destructionList)).toBe(false);
    });

    test("should not allow a user to update if they are not the assignee", () => {
      destructionList.assignee = anotherUser;
      expect(canUpdateDestructionList(user, destructionList)).toBe(false);
    });
  });

  describe(`canViewDestructionList() with destruction list status: ${status}`, () => {
    let destructionList: DestructionList;
    let user: User;
    let anotherUser: User;

    beforeEach(() => {
      user = userFactory({
        role: { canStartDestruction: true, canReviewDestruction: true },
      });
      anotherUser = { ...user, pk: 2 };
      destructionList = destructionListFactory({
        status,
        assignee: user,
        author: user,
      });
    });

    test("should allow the author to view the destruction list", () => {
      expect(canViewDestructionList(user, destructionList)).toBe(true);
    });

    test("should not allow a user who is not the author to view the destruction list", () => {
      destructionList.author = anotherUser;
      expect(canViewDestructionList(user, destructionList)).toBe(false);
    });
  });

  describe(`canMarkListAsFinal() with destruction list status: ${status}`, () => {
    let destructionList: DestructionList;
    let user: User;
    let anotherUser: User;

    beforeEach(() => {
      user = userFactory({
        role: { canStartDestruction: true, canReviewDestruction: true },
      });
      anotherUser = { ...user, pk: 2 };
      destructionList = destructionListFactory({
        status,
        assignee: user,
        author: user,
      });
    });

    test("should allow the author to mark the list as final if status is internally_reviewed and canStartDestruction is true", () => {
      const isEligible = status === "internally_reviewed";
      expect(canMarkListAsFinal(user, destructionList)).toBe(isEligible);
    });

    test("should not allow marking as final if the user is not the author", () => {
      destructionList.author = anotherUser;
      expect(canMarkListAsFinal(user, destructionList)).toBe(false);
    });

    test("should not allow marking as final if the status is not internally_reviewed", () => {
      const nonEligibleStatus = status !== "internally_reviewed";
      expect(canMarkListAsFinal(user, destructionList)).toBe(
        !nonEligibleStatus,
      );
    });

    test("should not allow marking as final if the user lacks canStartDestruction permission", () => {
      user = userFactory({
        role: { canStartDestruction: false, canReviewDestruction: true },
      });
      expect(canMarkListAsFinal(user, destructionList)).toBe(false);
    });
  });
});
