import {
  STATUSES_ELIGIBLE_FOR_EDIT,
  STATUSES_ELIGIBLE_FOR_REVIEW,
} from "../../pages/destructionlist/detail/constants";
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

/**
 * Helper function to generate user objects with different permissions
 * @param {boolean} canStartDestruction - Permission to start destruction
 * @param {boolean} canReviewDestruction - Permission to review destruction
 * @returns {User} - User object with specified permissions
 */
const generateUserWithPermissions = (
  canStartDestruction: boolean,
  canReviewDestruction: boolean,
): User => ({
  pk: 1,
  username: "testuser",
  firstName: "Test",
  lastName: "User",
  email: "testuser@example.com",
  role: {
    name: "Test Role",
    canStartDestruction,
    canReviewDestruction,
    canViewCaseDetails: true,
  },
});

describe("Permissions tests with all combinations", () => {
  DESTRUCTION_LIST_STATUSES.forEach((status) => {
    describe(`With destruction list status: ${status}`, () => {
      let destructionList: DestructionList;
      let user: User;
      let anotherUser: User;

      beforeEach(() => {
        user = generateUserWithPermissions(true, true);
        anotherUser = { ...user, pk: 2 };
        destructionList = {
          pk: 1,
          assignee: user,
          assignees: [],
          author: user,
          containsSensitiveInfo: false,
          created: "2023-01-01T00:00:00Z",
          name: "Test Destruction List",
          status,
          statusChanged: null,
          uuid: "12345-abcde",
        };
      });

      describe("canStartDestructionList", () => {
        it("should allow a user with the canStartDestruction role", () => {
          expect(canStartDestructionList(user)).toBe(true);
        });

        it("should not allow a user without the canStartDestruction role", () => {
          user = generateUserWithPermissions(false, true);
          expect(canStartDestructionList(user)).toBe(false);
        });
      });

      describe("canReviewDestructionList", () => {
        it("should allow a user to review if they have the role and status is eligible", () => {
          const isEligible = STATUSES_ELIGIBLE_FOR_REVIEW.includes(status);
          expect(canReviewDestructionList(user, destructionList)).toBe(
            isEligible,
          );
        });

        it("should not allow a user to review if they lack the role", () => {
          user = generateUserWithPermissions(true, false);
          expect(canReviewDestructionList(user, destructionList)).toBe(false);
        });

        it("should not allow a user to review if they are not the assignee", () => {
          destructionList.assignee = anotherUser;
          expect(canReviewDestructionList(user, destructionList)).toBe(false);
        });
      });

      describe("canUpdateDestructionList", () => {
        it("should allow a user to update if they have the role and status is eligible", () => {
          const isEligible = STATUSES_ELIGIBLE_FOR_EDIT.includes(status);
          expect(canUpdateDestructionList(user, destructionList)).toBe(
            isEligible,
          );
        });

        it("should not allow a user to update if they lack the role", () => {
          user = generateUserWithPermissions(false, true);
          expect(canUpdateDestructionList(user, destructionList)).toBe(false);
        });

        it("should not allow a user to update if they are not the assignee", () => {
          destructionList.assignee = anotherUser;
          expect(canUpdateDestructionList(user, destructionList)).toBe(false);
        });
      });

      describe("canViewDestructionList", () => {
        it("should allow the author to view the destruction list", () => {
          expect(canViewDestructionList(user, destructionList)).toBe(true);
        });

        it("should not allow a user who is not the author to view the destruction list", () => {
          destructionList.author = anotherUser;
          expect(canViewDestructionList(user, destructionList)).toBe(false);
        });
      });

      describe("canMarkListAsFinal", () => {
        it("should allow the author to mark the list as final if status is internally_reviewed and canStartDestruction is true", () => {
          const isEligible = status === "internally_reviewed";
          expect(canMarkListAsFinal(user, destructionList)).toBe(isEligible);
        });

        it("should not allow marking as final if the user is not the author", () => {
          destructionList.author = anotherUser;
          expect(canMarkListAsFinal(user, destructionList)).toBe(false);
        });

        it("should not allow marking as final if the status is not internally_reviewed", () => {
          const nonEligibleStatus = status !== "internally_reviewed";
          expect(canMarkListAsFinal(user, destructionList)).toBe(
            !nonEligibleStatus,
          );
        });

        it("should not allow marking as final if the user lacks canStartDestruction permission", () => {
          user = generateUserWithPermissions(false, true);
          expect(canMarkListAsFinal(user, destructionList)).toBe(false);
        });
      });
    });
  });
});
