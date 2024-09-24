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

  // Year tests (past and future)
  test("timeAgo() handles year ", () => {
    const yearAgo = new Date("2022-09-15:00:00");
    expect(timeAgo(yearAgo)).toBe("1 jaar geleden");
    expect(timeAgo(yearAgo, { shortFormat: true })).toBe("1j");

    const yearsAgo = new Date("2021-09-15:00:00");
    expect(timeAgo(yearsAgo)).toBe("2 jaren geleden");
    expect(timeAgo(yearsAgo, { shortFormat: true })).toBe("2j");

    const yearAhead = new Date("2024-09-15:00:00");
    expect(timeAgo(yearAhead)).toBe("over 1 jaar");
    expect(timeAgo(yearAhead, { shortFormat: true })).toBe("over 1j");

    const yearsAhead = new Date("2025-09-15:00:00");
    expect(timeAgo(yearsAhead)).toBe("over 2 jaren");
    expect(timeAgo(yearsAhead, { shortFormat: true })).toBe("over 2j");
  });

  // Month tests (past and future)
  test("timeAgo() handles month ", () => {
    const monthAgo = new Date("2023-08-15:00:00");
    expect(timeAgo(monthAgo)).toBe("1 maand geleden");
    expect(timeAgo(monthAgo, { shortFormat: true })).toBe("1ma");

    const monthsAgo = new Date("2023-07-15:00:00");
    expect(timeAgo(monthsAgo)).toBe("2 maanden geleden");
    expect(timeAgo(monthsAgo, { shortFormat: true })).toBe("2ma");

    const monthAhead = new Date("2023-10-15:00:00");
    expect(timeAgo(monthAhead)).toBe("over 1 maand");
    expect(timeAgo(monthAhead, { shortFormat: true })).toBe("over 1ma");

    const monthsAhead = new Date("2023-11-15:00:00");
    expect(timeAgo(monthsAhead)).toBe("over 2 maanden");
    expect(timeAgo(monthsAhead, { shortFormat: true })).toBe("over 2ma");
  });

  // Day tests (past and future)
  test("timeAgo() handles day ", () => {
    const dayAgo = new Date("2023-09-14:00:00");
    expect(timeAgo(dayAgo)).toBe("1 dag geleden");
    expect(timeAgo(dayAgo, { shortFormat: true })).toBe("1d");

    const daysAgo = new Date("2023-09-13:00:00");
    expect(timeAgo(daysAgo)).toBe("2 dagen geleden");
    expect(timeAgo(daysAgo, { shortFormat: true })).toBe("2d");

    const dayAhead = new Date("2023-09-16:00:00");
    expect(timeAgo(dayAhead)).toBe("over 1 dag");
    expect(timeAgo(dayAhead, { shortFormat: true })).toBe("over 1d");

    const daysAhead = new Date("2023-09-17:00:00");
    expect(timeAgo(daysAhead)).toBe("over 2 dagen");
    expect(timeAgo(daysAhead, { shortFormat: true })).toBe("over 2d");
  });

  // Hour tests (past and future)
  test("timeAgo() handles hour ", () => {
    const hourAgo = new Date("2023-09-14:23:00");
    expect(timeAgo(hourAgo)).toBe("1 uur geleden");
    expect(timeAgo(hourAgo, { shortFormat: true })).toBe("1u");

    const hoursAgo = new Date("2023-09-14:22:00");
    expect(timeAgo(hoursAgo)).toBe("2 uur geleden");
    expect(timeAgo(hoursAgo, { shortFormat: true })).toBe("2u");

    const hourAhead = new Date("2023-09-15:01:00");
    expect(timeAgo(hourAhead)).toBe("over 1 uur");
    expect(timeAgo(hourAhead, { shortFormat: true })).toBe("over 1u");

    const hoursAhead = new Date("2023-09-15:02:00");
    expect(timeAgo(hoursAhead)).toBe("over 2 uur");
    expect(timeAgo(hoursAhead, { shortFormat: true })).toBe("over 2u");
  });

  // Minute tests (past and future)
  test("timeAgo() handles minute ", () => {
    const minuteAgo = new Date("2023-09-14:23:59");
    expect(timeAgo(minuteAgo)).toBe("1 minuut geleden");
    expect(timeAgo(minuteAgo, { shortFormat: true })).toBe("1m");

    const minutesAgo = new Date("2023-09-14:23:58");
    expect(timeAgo(minutesAgo)).toBe("2 minuten geleden");
    expect(timeAgo(minutesAgo, { shortFormat: true })).toBe("2m");

    const minuteAhead = new Date("2023-09-15:00:01");
    expect(timeAgo(minuteAhead)).toBe("over 1 minuut");
    expect(timeAgo(minuteAhead, { shortFormat: true })).toBe("over 1m");

    const minutesAhead = new Date("2023-09-15:00:02");
    expect(timeAgo(minutesAhead)).toBe("over 2 minuten");
    expect(timeAgo(minutesAhead, { shortFormat: true })).toBe("over 2m");
  });

  // Less than a minute tests (past and future)
  test("timeAgo() handles less than a minute ", () => {
    const secondAgo = new Date("2023-09-14:23:59:59");
    expect(timeAgo(secondAgo)).toBe("Nu");
    expect(timeAgo(secondAgo, { shortFormat: true })).toBe("0m");

    const secondsAgo = new Date("2023-09-14:23:59:59");
    expect(timeAgo(secondsAgo)).toBe("Nu");
    expect(timeAgo(secondsAgo, { shortFormat: true })).toBe("0m");

    const secondAhead = new Date("2023-09-15:00:00:01");
    expect(timeAgo(secondAhead)).toBe("zo meteen");
    expect(timeAgo(secondAhead, { shortFormat: true })).toBe("0m");

    const secondsAhead = new Date("2023-09-15:00:00:02");
    expect(timeAgo(secondsAhead)).toBe("zo meteen");
    expect(timeAgo(secondsAhead, { shortFormat: true })).toBe("0m");
  });

  // Combined scenarios (past and future)
  test("timeAgo() handles combined scenario ", () => {
    const yearAgo = new Date("2022-08-14:23:59:59");
    expect(timeAgo(yearAgo)).toBe("1 jaar geleden");
    expect(timeAgo(yearAgo, { shortFormat: true })).toBe("1j");

    const monthsAgo = new Date("2023-07-13:22:58:58");
    expect(timeAgo(monthsAgo)).toBe("2 maanden geleden");
    expect(timeAgo(monthsAgo, { shortFormat: true })).toBe("2ma");

    const yearAhead = new Date("2025-08-14:23:59:59");
    expect(timeAgo(yearAhead)).toBe("over 1 jaar");
    expect(timeAgo(yearAhead, { shortFormat: true })).toBe("over 1j");

    const monthsAhead = new Date("2023-11-13:22:58:58");
    expect(timeAgo(monthsAhead)).toBe("over 1 maand");
    expect(timeAgo(monthsAhead, { shortFormat: true })).toBe("over 1ma");
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
