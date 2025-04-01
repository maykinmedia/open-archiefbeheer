import { useEffect, useRef } from "react";

import { useAlertOnError } from "./useAlertOnError";

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
    errormessage?: string;
  },
) {
  const alertOnError = useAlertOnError(
    options?.errormessage || "Er is een fout opgetreden!",
  );
  const active = useRef(true);
  const ref = useRef(-1);

  const cancel = () => {
    active.current = false;
    window.clearTimeout(ref.current);
  };

  useEffect(() => {
    const controller = new AbortController();
    /** Performs single "tick", awaits`fn()`, then calls `poll()` to reschedule. */
    const tick = async () => {
      try {
        // Call fn().
        await fn(controller.signal);
      } catch (e) {
        // Show error on failure.
        if (!controller.signal.aborted) {
          await alertOnError(e as Error);
        }
      } finally {
        // Reschedule next tick.
        poll();
      }
    };

    /** Sets a timeout of `[options.timeout=3000]` to schedule `tick()`. */
    const poll = () => {
      // Stop.
      if (active.current) {
        ref.current = window.setTimeout(() => tick(), options?.timeout ?? 3000);
      }
    };

    // Schedule first run.
    tick();

    // Return a function that clears the scheduled `tick()`.
    return () => {
      controller.abort();
      cancel();
    };
  }, deps);

  useEffect(() => {
    active.current = true;
  });

  // Return a function that clears the scheduled `tick()`.
  return cancel;
}
