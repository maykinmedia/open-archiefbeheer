import { formatDate, timeAgo } from "./date";

describe("formatDate()", () => {
  beforeEach(mockDate);
  afterEach(unMockDate);

  test("formatDate() formats Date object ", () => {
    const date = new Date();
    expect(formatDate(date)).toBe("15/09/2023");
  });

  test("formatDate() formats date string ", () => {
    const dateString = "1988-08-02";
    expect(formatDate(dateString)).toBe("02/08/1988");
  });
});

describe("timeAgo()", () => {
  beforeEach(mockDate);
  afterEach(unMockDate);

  test("timeAgo() handles year ", () => {
    const yearAgo = new Date("2022-09-15:00:00");
    expect(timeAgo(yearAgo)).toBe("1 jaar geleden");
    expect(timeAgo(yearAgo, { shortFormat: true })).toBe("1j");

    const yearsAgo = new Date("2021-09-15:00:00");
    expect(timeAgo(yearsAgo)).toBe("2 jaren geleden");
    expect(timeAgo(yearsAgo, { shortFormat: true })).toBe("2j");
  });

  test("timeAgo() handles month ", () => {
    const monthAgo = new Date("2023-08-15:00:00");
    expect(timeAgo(monthAgo)).toBe("1 maand geleden");
    expect(timeAgo(monthAgo, { shortFormat: true })).toBe("1ma");

    const monthsAgo = new Date("2023-07-15:00:00");
    expect(timeAgo(monthsAgo)).toBe("2 maanden geleden");
    expect(timeAgo(monthsAgo, { shortFormat: true })).toBe("2ma");
  });

  test("timeAgo() handles day ", () => {
    const dayAgo = new Date("2023-09-14:00:00");
    expect(timeAgo(dayAgo)).toBe("1 dag geleden");
    expect(timeAgo(dayAgo, { shortFormat: true })).toBe("1d");

    const daysAgo = new Date("2023-09-13:00:00");
    expect(timeAgo(daysAgo)).toBe("2 dagen geleden");
    expect(timeAgo(daysAgo, { shortFormat: true })).toBe("2d");
  });

  test("timeAgo() handles hour ", () => {
    const hourAgo = new Date("2023-09-14:23:00");
    expect(timeAgo(hourAgo)).toBe("1 uur geleden");
    expect(timeAgo(hourAgo, { shortFormat: true })).toBe("1u");

    const hoursAgo = new Date("2023-09-14:22:00");
    expect(timeAgo(hoursAgo)).toBe("2 uur geleden");
    expect(timeAgo(hoursAgo, { shortFormat: true })).toBe("2u");
  });

  test("timeAgo() handles minute ", () => {
    const minuteAgo = new Date("2023-09-14:23:59");
    expect(timeAgo(minuteAgo)).toBe("1 minuut geleden");
    expect(timeAgo(minuteAgo, { shortFormat: true })).toBe("1m");

    const minutesAgo = new Date("2023-09-14:23:58");
    expect(timeAgo(minutesAgo)).toBe("2 minuten geleden");
    expect(timeAgo(minutesAgo, { shortFormat: true })).toBe("2m");
  });

  test("timeAgo() handles less than a minute ", () => {
    const secondAgo = new Date("2023-09-14:23:59:59");
    expect(timeAgo(secondAgo)).toBe("Nu");
    expect(timeAgo(secondAgo, { shortFormat: true })).toBe("0m");

    const secondsAgo = new Date("2023-09-14:23:59:59");
    expect(timeAgo(secondsAgo)).toBe("Nu");
    expect(timeAgo(secondsAgo, { shortFormat: true })).toBe("0m");
  });

  test("timeAgo() interprets future data as now ", () => {
    const yearFromNow = new Date("2024-09-15:00:00");
    expect(timeAgo(yearFromNow)).toBe("Nu");
    expect(timeAgo(yearFromNow, { shortFormat: true })).toBe("0m");
  });

  test("timeAgo() handles combined scenario ", () => {
    const yearAgo = new Date("2022-08-14:23:59:59");
    expect(timeAgo(yearAgo)).toBe("1 jaar geleden");
    expect(timeAgo(yearAgo, { shortFormat: true })).toBe("1j");

    const monthsAgo = new Date("2023-07-13:22:58:58");
    expect(timeAgo(monthsAgo)).toBe("2 maanden geleden");
    expect(timeAgo(monthsAgo, { shortFormat: true })).toBe("2ma");
  });
});

const SYMBOL_NATIVE_DATE = Symbol();

/**
 * Mock Date() constructor to default to a predefined date if no value is provided.
 */
function mockDate() {
  // @ts-expect-error - set native reference.
  window[SYMBOL_NATIVE_DATE] = window.Date;
  // @ts-expect-error - set fake implementation
  window.Date = function (ds = "2023-09-15:00:00:00") {
    // @ts-expect-error - use native reference.
    return new window[SYMBOL_NATIVE_DATE](ds);
  };
}

/**
 * Restores original Date constructor.
 */
function unMockDate() {
  // @ts-expect-error - check native implementation
  if (window[SYMBOL_NATIVE_DATE]) {
    // @ts-expect-error - set native implementation
    window.Date = window[SYMBOL_NATIVE_DATE];
  }
}
