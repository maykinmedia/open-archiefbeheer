import { fn, spyOn } from "@storybook/test";
import React from "react";

import { usePoll } from "./usePoll";

describe("usePoll()", () => {
  test("usePoll() schedules `fn` ", async () => {
    spyOn(React, "useRef").mockReturnValue({ current: null });
    const spy = fn();
    usePoll(spy, { timeout: 300 });
    return _delay(() => expect(spy).toBeCalledTimes(1), 300);
  });

  test("usePoll() reschedules `fn` after completion", async () => {
    spyOn(React, "useRef").mockReturnValue({ current: null });
    const spy = fn(() => _delay(() => undefined, 300));
    usePoll(spy, { timeout: 300 });
    return _delay(() => expect(spy).toBeCalledTimes(2), 1000);
  });

  test("usePoll() delays first `fn` call", async () => {
    spyOn(React, "useRef").mockReturnValue({ current: null });
    const spy = fn();
    usePoll(spy, { timeout: 300 });
    return _delay(() => expect(spy).toBeCalledTimes(0), 0);
  });

  test("usePoll() has a default timeout", async () => {
    spyOn(React, "useRef").mockReturnValue({ current: null });
    const spy = fn();
    usePoll(spy);
    return _delay(() => expect(spy).toBeCalledTimes(1), 3000);
  });

  test("usePoll() returns a cancel function", async () => {
    spyOn(React, "useRef").mockReturnValue({ current: null });
    const spy = fn();
    const cancel = usePoll(spy, { timeout: 300 });
    cancel();
    return _delay(() => expect(spy).toBeCalledTimes(0), 300);
  });

  test("usePoll() prevents duplicate calls", async () => {
    spyOn(React, "useRef").mockReturnValue({ current: 1 });
    const spy = fn();
    usePoll(spy, { timeout: 300 });
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
