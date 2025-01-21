import { clearPreference, getPreference, setPreference } from "./preferences";

describe("getPreference", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should retrieve a stored string preference", async () => {
    sessionStorage.setItem(
      "oab.lib.preference.testKey",
      JSON.stringify({ type: "string", value: "testValue" }),
    );
    const result = await getPreference<string>("testKey");
    expect(result).toBe("testValue");
  });

  it("should retrieve a stored number preference", async () => {
    sessionStorage.setItem(
      "oab.lib.preference.testKey",
      JSON.stringify({ type: "number", value: "1" }),
    );
    const result = await getPreference<number>("testKey");
    expect(result).toBe(1);
  });

  it("should retrieve a stored boolean preference", async () => {
    sessionStorage.setItem(
      "oab.lib.preference.testKey",
      JSON.stringify({ type: "boolean", value: "true" }),
    );
    const result = await getPreference<boolean>("testKey");
    expect(result).toBe(true);
  });

  it("should retrieve a stored null preference", async () => {
    sessionStorage.setItem(
      "oab.lib.preference.testKey",
      JSON.stringify({ type: "null", value: "null" }),
    );
    const result = await getPreference<null>("testKey");
    expect(result).toBe(null);
  });

  it("should retrieve a stored object preference", async () => {
    const obj = { a: 1, b: "test" };
    sessionStorage.setItem(
      "oab.lib.preference.testKey",
      JSON.stringify({ type: "json", value: JSON.stringify(obj) }),
    );
    const result = await getPreference<object>("testKey");
    expect(result).toEqual(obj);
  });

  it("should return undefined for a non-existent key", async () => {
    const result = await getPreference<string>("nonExistentKey");
    expect(result).toBeUndefined();
  });
});

describe("setPreference", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should store a string preference", async () => {
    await setPreference<string>("testKey", "testValue");
    const stored = JSON.parse(
      sessionStorage.getItem("oab.lib.preference.testKey")!,
    );
    expect(stored).toEqual({ type: "string", value: "testValue" });
  });

  it("should store a number preference", async () => {
    await setPreference<number>("testKey", 1);
    const stored = JSON.parse(
      sessionStorage.getItem("oab.lib.preference.testKey")!,
    );
    expect(stored).toEqual({ type: "number", value: 1 });
  });

  it("should store a boolean preference", async () => {
    await setPreference<boolean>("testKey", true);
    const stored = JSON.parse(
      sessionStorage.getItem("oab.lib.preference.testKey")!,
    );
    expect(stored).toEqual({ type: "boolean", value: true });
  });

  it("should store a null preference", async () => {
    await setPreference<null>("testKey", null);
    const stored = JSON.parse(
      sessionStorage.getItem("oab.lib.preference.testKey")!,
    );
    expect(stored).toEqual({ type: "null", value: null });
  });

  it("should store an object preference", async () => {
    const obj = { a: 1, b: "test" };
    await setPreference<Record<string, number | string>>("testKey", obj);
    const stored = JSON.parse(
      sessionStorage.getItem("oab.lib.preference.testKey")!,
    );
    expect(stored).toEqual({ type: "json", value: JSON.stringify(obj) });
  });

  it("should throw an error for unsupported types like function", async () => {
    const unsupportedValue = () => {};
    await expect(setPreference("testKey", unsupportedValue)).rejects.toThrow(
      "Function values are not supported as preference.",
    );
  });
});

describe.only("clearPreference", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should clear a stored preference", async () => {
    await setPreference("testKey", "testValue");
    await clearPreference("testKey");
    expect(await getPreference("testKey")).toBeUndefined();
  });
});
