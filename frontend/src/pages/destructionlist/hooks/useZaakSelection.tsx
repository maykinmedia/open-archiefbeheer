import { useRef } from "react";
import { useRevalidator } from "react-router-dom";

/**
 *  TODO: Implement reloading zaak selection when a changes is detected.
 * @param storageKey
 */
export function useZaakSelection(storageKey: string) {
  const revalidator = useRevalidator();
  const timeoutRef = useRef<number>();

  const checkForUpdate = async () => {
    try {
      const shouldUpdate = false;
      if (shouldUpdate) {
        console.log("should revalidate");
        revalidator.revalidate();
        return false;
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const tick = async (fn: () => Promise<unknown>) => {
    const result = await fn();
    if (result !== false) {
      poll(fn);
    }
  };

  const poll = (fn: () => Promise<unknown>) => {
    timeoutRef.current = window.setTimeout(() => tick(fn), 1000);
  };

  poll(checkForUpdate);

  return () => {
    console.log("destroy called");
    console.log(">", timeoutRef.current);
    window.clearTimeout(timeoutRef.current);
  };
}
