import { beforeEach } from "vitest";

import {
  CACHE_CONFIG,
  CacheRecord,
  cacheDelete,
  cacheGet,
  cacheMemo,
  cacheSet,
} from "./cache";

describe("CACHE_CONFIG", () => {
  test("should read", () => {
    expect(CACHE_CONFIG.DISABLED).not.toBeUndefined();
    expect(CACHE_CONFIG.KEY_PREFIX).not.toBeUndefined();
    expect(CACHE_CONFIG.MAX_AGE).not.toBeUndefined();
  });

  test("should write", () => {
    CACHE_CONFIG.DISABLED = true;
    CACHE_CONFIG.KEY_PREFIX = "test.cache_config.key_prefix";
    CACHE_CONFIG.MAX_AGE = 1234;

    expect(CACHE_CONFIG.DISABLED).toBe(true);
    expect(CACHE_CONFIG.KEY_PREFIX).toBe("test.cache_config.key_prefix");
    expect(CACHE_CONFIG.MAX_AGE).toBe(1234);
  });
});

describe("cacheGet", () => {
  beforeEach(() => {
    CACHE_CONFIG.DISABLED = false;
    CACHE_CONFIG.KEY_PREFIX = "test.cache_config.key_prefix";
    CACHE_CONFIG.MAX_AGE = 60000;
    sessionStorage.clear();
  });

  test("should return null when cache is disabled", async () => {
    CACHE_CONFIG.DISABLED = true;

    const record: CacheRecord = {
      timestamp: new Date().getTime(),
      value: "bar",
    };

    sessionStorage.setItem(
      "test.cache_config.key_prefix.foo",
      JSON.stringify(record),
    );
    expect(await cacheGet("foo")).toBeNull();
  });

  test("should return null when a cache record does not exist", async () => {
    expect(await cacheGet("nonExistingItem")).toBeNull();
  });

  test("should remove an expired cache record", async () => {
    const record: CacheRecord = {
      timestamp: 0,
      value: "bar",
    };

    sessionStorage.setItem(
      "test.cache_config.key_prefix.foo",
      JSON.stringify(record),
    );

    await cacheGet("foo");
    expect(
      sessionStorage.getItem("test.cache_config.key_prefix.foo"),
    ).toBeNull();
  });

  test("should return null when a cache record is expired", async () => {
    const record: CacheRecord = {
      timestamp: 0,
      value: "bar",
    };

    sessionStorage.setItem(
      "test.cache_config.key_prefix.foo",
      JSON.stringify(record),
    );

    expect(await cacheGet("foo")).toBeNull();
  });

  test("should return the cached value when a valid cache record exists", async () => {
    const record: CacheRecord = {
      timestamp: new Date().getTime(),
      value: "bar",
    };

    sessionStorage.setItem(
      "test.cache_config.key_prefix.foo",
      JSON.stringify(record),
    );

    expect(await cacheGet("foo")).toBe("bar");
  });
});

describe("cacheSet", () => {
  beforeEach(() => {
    CACHE_CONFIG.DISABLED = false;
    CACHE_CONFIG.KEY_PREFIX = "test.cache_config.key_prefix";
    CACHE_CONFIG.MAX_AGE = 60000;
    sessionStorage.clear();
  });

  test("should not set a cache record when cache is disabled", async () => {
    CACHE_CONFIG.DISABLED = true;

    await cacheSet("foo", "bar");

    expect(
      sessionStorage.getItem("test.cache_config.key_prefix.foo"),
    ).toBeNull();
  });

  test("should set a cache record when cache is not disabled", async () => {
    await cacheSet("foo", "bar");

    const record: CacheRecord = JSON.parse(
      sessionStorage.getItem("test.cache_config.key_prefix.foo") as string,
    );

    expect(record.value).toBe("bar");
  });
});

describe("cacheDelete", () => {
  beforeEach(() => {
    CACHE_CONFIG.DISABLED = false;
    CACHE_CONFIG.KEY_PREFIX = "test.cache_config.key_prefix";
    CACHE_CONFIG.MAX_AGE = 60000;
    sessionStorage.clear();
  });

  test("should remove a cache record", async () => {
    const record: CacheRecord = {
      timestamp: 0,
      value: "bar",
    };

    sessionStorage.setItem(
      "test.cache_config.key_prefix.foo",
      JSON.stringify(record),
    );

    await cacheDelete("foo");

    expect(
      sessionStorage.getItem("test.cache_config.key_prefix.foo"),
    ).toBeNull();
  });

  test("should not remove parameterized cache record if startsWith=false", async () => {
    const record: CacheRecord = {
      timestamp: 0,
      value: "bar",
    };

    sessionStorage.setItem(
      "test.cache_config.key_prefix.foo#bar",
      JSON.stringify(record),
    );

    await cacheDelete("foo", false);
    const resolveRecord: CacheRecord = JSON.parse(
      sessionStorage.getItem("test.cache_config.key_prefix.foo#bar") as string,
    );

    expect(resolveRecord.value).toBe("bar");
  });

  test("should remove parameterized cache record if startsWith=true", async () => {
    const record: CacheRecord = {
      timestamp: 0,
      value: "bar",
    };

    sessionStorage.setItem(
      "test.cache_config.key_prefix.foo#bar",
      JSON.stringify(record),
    );

    await cacheDelete("foo", true);
    expect(
      sessionStorage.getItem("test.cache_config.key_prefix.foo#bar"),
    ).toBeNull();
  });
});

describe("cacheMemo", () => {
  beforeEach(() => {
    CACHE_CONFIG.DISABLED = false;
    CACHE_CONFIG.KEY_PREFIX = "test.cache_config.key_prefix";
    CACHE_CONFIG.MAX_AGE = 60000;
    sessionStorage.clear();
  });

  test("should store a parameterized cache record", async () => {
    const strReverse = (value: string) => value.split("").reverse().join("");
    await cacheMemo("foo", strReverse, ["bar"]);

    const record: CacheRecord = JSON.parse(
      sessionStorage.getItem("test.cache_config.key_prefix.foo#bar") as string,
    );
    expect(record.value).toBe("rab");
  });

  test("should memoize a function", async () => {
    const fn = vitest.fn((value: number) => value);

    const result1 = await cacheMemo("foo", fn, [1]); // Initial
    const result2 = await cacheMemo("foo", fn, [2]); // Different params
    const result3 = await cacheMemo("foo", fn, [1]); // Memoized

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result1).toBe(1);
    expect(result2).toBe(2);
    expect(result3).toBe(1);
  });

  test("should not used cache results for expired cache record", async () => {
    CACHE_CONFIG.MAX_AGE = -1;
    const fn = vitest.fn((value: number) => value);

    await cacheMemo("foo", fn, [1]); // Initial
    await cacheMemo("foo", fn, [1]); // Memoized but expird

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
