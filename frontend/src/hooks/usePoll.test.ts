import React from "react";

import { usePoll } from "./usePoll";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: (fn: React.EffectCallback) => fn(),
}));

describe("usePoll()", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test("usePoll() schedules `fn` ", async () => {
    const spy = jest.fn();
    usePoll(spy, { timeout: 300 });
    _delay(() => expect(spy).toBeCalledTimes(1), 300);
  });

  test("usePoll() reschedules `fn` after completion", async () => {
    const spy = jest.fn(() => _delay(() => undefined, 300));
    usePoll(spy, { timeout: 300 });
    _delay(() => expect(spy).toBeCalledTimes(2), 1000);
  });

  test("usePoll() delays first `fn` call", async () => {
    const spy = jest.fn();
    usePoll(spy, { timeout: 300 });
    _delay(() => expect(spy).toBeCalledTimes(0), 0);
  });

  test("usePoll() has a default timeout", async () => {
    const spy = jest.fn();
    usePoll(spy);
    _delay(() => expect(spy).toBeCalledTimes(1), 3000);
  });

  test("usePoll() returns a cancel function", async () => {
    let cancelFn: ReturnType<React.EffectCallback> = () => undefined;
    jest
      .spyOn(React, "useEffect")
      .mockImplementation((fn) => (cancelFn = fn()));
    const spy = jest.fn();

    usePoll(spy, { timeout: 300 });
    cancelFn();
    _delay(() => expect(spy).toBeCalledTimes(0), 300);
  });
});

/**
 * `waitFor()` but with exact delay, used for checking timed events.
 * @param fn
 * @param delay
 */
function _delay(fn: () => void, delay: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        fn();
      } catch (e) {
        reject(e);
      } finally {
        resolve(true);
      }
    }, delay);
  });
}
