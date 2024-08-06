import { fn, spyOn } from "@storybook/test";
import React from "react";

import { usePoll } from "./usePoll";

describe("usePoll()", () => {
  beforeAll(() => {
    spyOn(React, "useEffect").mockImplementation((fn) => fn());
  });

  test("usePoll() schedules `fn` ", async () => {
    const spy = fn();
    usePoll(spy, { timeout: 300 });
    return _delay(() => expect(spy).toBeCalledTimes(1), 300);
  });

  test("usePoll() reschedules `fn` after completion", async () => {
    const spy = fn(() => _delay(() => undefined, 300));
    usePoll(spy, { timeout: 300 });
    return _delay(() => expect(spy).toBeCalledTimes(2), 1000);
  });

  test("usePoll() delays first `fn` call", async () => {
    const spy = fn();
    usePoll(spy, { timeout: 300 });
    return _delay(() => expect(spy).toBeCalledTimes(0), 0);
  });

  test("usePoll() has a default timeout", async () => {
    const spy = fn();
    usePoll(spy);
    return _delay(() => expect(spy).toBeCalledTimes(1), 3000);
  });

  test("usePoll() returns a cancel function", async () => {
    let cancelFn = () => undefined;
    // @ts-expect-error - void | Destructor
    spyOn(React, "useEffect").mockImplementation((fn) => (cancelFn = fn()));
    const spy = fn();

    usePoll(spy, { timeout: 300 });
    cancelFn();
    return _delay(() => expect(spy).toBeCalledTimes(0), 300);
  });
});

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
