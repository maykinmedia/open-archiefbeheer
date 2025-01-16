import { getCookie } from "./cookie";

describe("getCookie", () => {
  beforeEach(() => {
    // Clear cookies before each test
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  test("should return the value of an existing cookie", () => {
    document.cookie = "testCookie=testValue";
    const result = getCookie("testCookie");
    expect(result).toBe("testValue");
  });

  test("should return null if the cookie does not exist", () => {
    const result = getCookie("nonExistentCookie");
    expect(result).toBeNull();
  });

  test("should handle cookies with spaces correctly", () => {
    document.cookie = "cookieWithSpace=   spacedValue";
    const result = getCookie("cookieWithSpace");
    expect(result).toBe("spacedValue");
  });

  test("should handle multiple cookies and return the correct value", () => {
    document.cookie =
      "firstCookie=firstValue; secondCookie=secondValue; thirdCookie=thirdValue";
    expect(getCookie("firstCookie")).toBe("firstValue");
    expect(getCookie("secondCookie")).toBe("secondValue");
    expect(getCookie("thirdCookie")).toBe("thirdValue");
  });

  test("should return null if the cookie name is a partial match", () => {
    document.cookie = "partialMatchCookie=value";
    const result = getCookie("partial");
    expect(result).toBeNull();
  });

  test("should handle cookies with special characters", () => {
    document.cookie = "special@Cookie=value@123";
    const result = getCookie("special@Cookie");
    expect(result).toBe("value@123");
  });

  test("should trim leading spaces in cookie values", () => {
    document.cookie = "trimCookie=   trimmedValue";
    const result = getCookie("trimCookie");
    expect(result).toBe("trimmedValue");
  });
});
