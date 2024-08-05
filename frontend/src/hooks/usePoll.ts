import { useRef } from "react";

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
  const timeoutRef = useRef<number>();

  /** Performs single "tick", awaits`fn()`, then calls `poll()` to reschedule. */
  const tick = async () => {
    await fn();
    poll();
  };

  /** Sets a timeout of `[options.timeout=3000]` to schedule `tick()`. */
  const poll = () => {
    timeoutRef.current = window.setTimeout(
      () => tick(),
      options?.timeout ?? 3000,
    );
  };

  // If `timeoutRef.current` is not set, schedule first run.
  if (!timeoutRef.current) {
    poll();
  }

  // Return a function that clears the scheduled `tick()`.
  return () => {
    window.clearTimeout(timeoutRef.current);
  };
}
