import { useEffect } from "react";

/**
 * Polls `fn` every [`options.timeout=30000`]ms.
 * Reschedules after `fn` resolution to prevent flooding.
 * @param fn
 * @param options
 */
export function usePoll<T = unknown>(
  fn: () => T | Promise<T>,
  options?: {
    timeout?: number;
  },
) {
  useEffect(() => {
    let active = true;
    let ref: number;

    /** Performs single "tick", awaits`fn()`, then calls `poll()` to reschedule. */
    const tick = async () => {
      await fn();
      poll();
    };

    /** Sets a timeout of `[options.timeout=3000]` to schedule `tick()`. */
    const poll = () => {
      // Stop.
      if (!active) {
        return;
      }

      ref = window.setTimeout(() => tick(), options?.timeout ?? 3000);
    };

    // Schedule first run.
    poll();

    // Return a function that clears the scheduled `tick()`.
    return () => {
      active = false;
      window.clearTimeout(ref);
    };
  }, []);
}
