import { renderHook } from "@testing-library/react";

import { usePoll } from "./usePoll";

describe("usePoll()", () => {
  test("usePoll() schedules `fn` ", async () => {
    const spy = vi.fn();
    renderHook(() => usePoll(spy, [], { timeout: 300 }));
    await _delay(() => expect(spy).toBeCalledTimes(1), 300);
  });

  test("usePoll() reschedules `fn` after completion", async () => {
    const spy = vi.fn(() => _delay(() => undefined, 300));
    renderHook(() => usePoll(spy, [], { timeout: 300 }));
    await _delay(() => expect(spy).toBeCalledTimes(2), 1000);
  });

  test("usePoll() delays first `fn` call", async () => {
    const spy = vi.fn();
    renderHook(() => usePoll(spy, [], { timeout: 300 }));
    await _delay(() => expect(spy).toBeCalledTimes(0), 0);
  });

  test("usePoll() has a default timeout", async () => {
    const spy = vi.fn();
    renderHook(() => usePoll(spy));
    await _delay(() => expect(spy).toBeCalledTimes(1), 3000);
  });

  test("usePoll() returns a cancel function", async () => {
    const spy = vi.fn();
    const {
      result: { current: cancelFn },
    } = renderHook(() => usePoll(spy, [], { timeout: 300 }));

    cancelFn();
    await _delay(() => expect(spy).toBeCalledTimes(0), 300);
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
