import { useCallback, useEffect } from "react";

/**
 * Polls `fn` every [`options.timeout=30000`]ms.
 * Reschedules after `fn` resolution to prevent flooding.
 * @param fn
 * @param options
 * @param deps
 */
export function usePoll<T = unknown>(
  fn: (signal?: AbortSignal) => T | Promise<T>,
  deps?: unknown[],
  options?: {
    timeout?: number;
  },
) {
  let active = true;
  let ref: number = -1;

  const cancel = useCallback(() => {
    active = false;
    window.clearTimeout(ref);
  }, [active, ref, ...(deps || [])]);

  useEffect(() => {
    const controller = new AbortController();
    /** Performs single "tick", awaits`fn()`, then calls `poll()` to reschedule. */
    const tick = async () => {
      await fn(controller.signal);
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
    tick();

    // Return a function that clears the scheduled `tick()`.
    return () => {
      controller.abort();
      cancel();
    };
  }, deps);

  // Return a function that clears the scheduled `tick()`.
  return cancel;
}
