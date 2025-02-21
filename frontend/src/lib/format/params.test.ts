import {
  entries2CacheKey,
  params2CacheKey,
  params2Entries,
  params2Object,
} from "./params";

describe("params2Object()", () => {
  test("should return correct object when URLSearchParams instance is passed", () => {
    const obj = params2Object(new URLSearchParams("?foo=bar"));
    expect(obj).toEqual({ foo: "bar" });
  });

  test("should return correct object when object is passed", () => {
    const obj = params2Object({ foo: true, bar: 5 });
    expect(obj).toEqual({ foo: "true", bar: "5" });
  });
});

describe("params2Entries()", () => {
  test("should return correct entries when URLSearchParams instance is passed", () => {
    const obj = params2Entries(new URLSearchParams("?foo=bar&bar=baz"));
    expect(obj).toEqual([
      ["foo", "bar"],
      ["bar", "baz"],
    ]);
  });

  test("should return correct entries when object is passed", () => {
    const obj = params2Entries({ foo: true, bar: 5 });
    expect(obj).toEqual([
      ["foo", "true"],
      ["bar", "5"],
    ]);
  });
});

describe("params2CacheKey()", () => {
  test("should return correct string when URLSearchParams instance is passed", () => {
    const obj = params2CacheKey(new URLSearchParams("?foo=bar&bar=baz"));
    expect(obj).toEqual("bar=baz:foo=bar");
  });

  test("should return correct object when object is passed", () => {
    const obj = params2CacheKey({ foo: true, bar: 5 });
    expect(obj).toEqual("bar=5:foo=true");
  });
});

describe("entries2CacheKey()", () => {
  test("should return correct string when entries are passed", () => {
    const obj = entries2CacheKey([
      ["foo", "bar"],
      ["bar", "baz"],
    ]);
    expect(obj).toEqual("bar=baz:foo=bar");
  });
});
