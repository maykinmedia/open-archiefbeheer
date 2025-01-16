import { User } from "../api/auth";
import { formatUser } from "./user";

describe("formatUser", () => {
  test("should return an empty string if the user is null or undefined", () => {
    // @ts-expect-error - testing untyped behavior.
    expect(formatUser(null)).toBe("");
    // @ts-expect-error - testing untyped behavior.
    expect(formatUser(undefined)).toBe("");
  });

  test("should return the username if firstName and lastName are missing", () => {
    const user: User = {
      username: "johndoe",
      firstName: "",
      lastName: "",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user)).toBe("johndoe");
  });

  test("should return the first name and username if lastName is missing", () => {
    const user: User = {
      username: "johndoe",
      firstName: "John",
      lastName: "",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user)).toBe("John (johndoe)");
  });

  test("should return the last name and username if firstName is missing", () => {
    const user: User = {
      username: "johndoe",
      firstName: "",
      lastName: "Doe",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user)).toBe("Doe (johndoe)");
  });

  test("should return full name and username when both firstName and lastName are present", () => {
    const user: User = {
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user)).toBe("John Doe (johndoe)");
  });

  test("should return full name without username when showUsername is false", () => {
    const user: User = {
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user, { showUsername: false })).toBe("John Doe");
  });

  test("should return first name without username when showUsername is false and lastName is missing", () => {
    const user: User = {
      username: "johndoe",
      firstName: "John",
      lastName: "",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user, { showUsername: false })).toBe("John");
  });

  test("should return last name without username when showUsername is false and firstName is missing", () => {
    const user: User = {
      username: "johndoe",
      firstName: "",
      lastName: "Doe",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user, { showUsername: false })).toBe("Doe");
  });

  test("should handle trimming properly when fields contain extra spaces", () => {
    const user: User = {
      username: "johndoe",
      firstName: "  John  ",
      lastName: "  Doe ",
      pk: 0,
      email: "",
      role: {
        canStartDestruction: false,
        canReviewDestruction: false,
        canCoReviewDestruction: false,
        canReviewFinalList: false,
      },
    };
    expect(formatUser(user)).toBe("John Doe (johndoe)");
  });
});
