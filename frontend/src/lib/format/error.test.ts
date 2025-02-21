import { collectErrors } from "./error";

describe("collectErrors()", () => {
  test("should return an array with a single string when the input is a string", () => {
    const errors = "This is an error";
    const result = collectErrors(errors);
    expect(result).toEqual(["This is an error"]);
  });

  test("should return a flat array of error messages for a nested object", () => {
    const errors = {
      name: ["Name is required", "Name must be at least 3 characters"],
      email: ["Email is required"],
    };
    const result = collectErrors(errors);
    expect(result).toEqual([
      "Name is required",
      "Name must be at least 3 characters",
      "Email is required",
    ]);
  });

  test("should handle deeply nested error objects", () => {
    const errors = {
      user: {
        name: ["Name is required"],
        address: {
          street: ["Street is required"],
          city: ["City is required"],
        },
      },
      email: ["Email is invalid"],
    };
    const result = collectErrors(errors);
    expect(result).toEqual([
      "Name is required",
      "Street is required",
      "City is required",
      "Email is invalid",
    ]);
  });

  test("should return an empty array for an empty object", () => {
    const errors = {};
    const result = collectErrors(errors);
    expect(result).toEqual([]);
  });

  test("should handle a mix of strings and nested objects", () => {
    const errors = {
      global: "Something went wrong",
      fields: {
        username: ["Username is required"],
        password: ["Password is too short"],
      },
    };
    const result = collectErrors(errors);
    expect(result).toEqual([
      "Something went wrong",
      "Username is required",
      "Password is too short",
    ]);
  });

  test("should handle arrays of errors directly in the input", () => {
    const errors = ["Error 1", "Error 2"];
    const result = collectErrors(errors);
    expect(result).toEqual(["Error 1", "Error 2"]);
  });

  test("should return an empty array for null or undefined inputs", () => {
    // @ts-expect-error - testing untyped behavior.
    expect(collectErrors(null)).toEqual([]);
    // @ts-expect-error - testing untyped behavior.
    expect(collectErrors(undefined)).toEqual([]);
  });

  test("should handle objects with non-string values gracefully", () => {
    const errors = {
      code: 123,
      details: {
        field: ["Field is required"],
        nested: {
          key: true,
        },
      },
    };
    const result = collectErrors(errors);
    expect(result).toEqual(["Field is required"]);
  });
});
