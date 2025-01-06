import { render } from "@testing-library/react";
import { useContext, useEffect, useState } from "react";

import {
  DEFAULT_ZAAK_SELECTION_CONTEXT,
  ZaakSelectionContext,
  ZaakSelectionContextProvider,
  ZaakSelectionContextType,
} from "./ZaakSelectionContext";

/**
 * Test component providing tests for context.
 * @param expected Object containing the expected context (after callback have been run).
 * @param callbackParams Object containing the values for any of the callback functions.
 */
function TestZaakSelectionContext({
  expected,
  callbackParams,
}: {
  expected: Partial<ZaakSelectionContextType>;
  callbackParams?: Partial<Record<keyof ZaakSelectionContextType, unknown>>;
}) {
  const context = useContext(ZaakSelectionContext);
  const [callbacksComplete, setCallbacksComplete] = useState(false);
  const [assertionsComplete, setAssertionsComplete] = useState(false);

  // Apply `callbackParams`.
  useEffect(() => {
    for (const _key in callbackParams) {
      const key = _key as keyof ZaakSelectionContextType;
      const value = callbackParams[key];
      const fn = context[key] as (value: unknown) => void;
      fn(value);
      setCallbacksComplete(true);
    }
  }, [callbackParams]);

  // Assert `expected`.
  useEffect(() => {
    // Callbacks not yet run.
    if (!callbacksComplete) {
      return;
    }
    for (const _key in expected) {
      const key = _key as keyof ZaakSelectionContextType;

      if (typeof context[key] === "function") {
        continue;
      }

      // Run assertion.
      expect(context[key]).toEqual(expected?.[key]);
    }

    setAssertionsComplete(true);
  }, [callbacksComplete]);

  // Check that callbacks don't throw exception.
  useEffect(() => {
    // Callbacks not yet run.
    if (!assertionsComplete) {
      return;
    }

    for (const _key in context) {
      const key = _key as keyof ZaakSelectionContextType;
      if (typeof context[key] === "function") {
        const initialFn = DEFAULT_ZAAK_SELECTION_CONTEXT[key] as (
          ...args: unknown[]
        ) => void;
        const fn = context[key] as (...args: unknown[]) => void;

        expect(initialFn).not.toThrow();
        expect(fn).not.toThrow();
      }
    }
  }, [assertionsComplete]);

  return null;
}

describe("ZaakSelectionContextProvider", () => {
  it("should provide default context values", () => {
    const expected: Partial<ZaakSelectionContextType> = {
      allPagesSelected: false,
      selectionSize: 0,
      pageSpecificZaakSelection: {},
    };

    render(
      <ZaakSelectionContextProvider>
        <TestZaakSelectionContext expected={expected} />
      </ZaakSelectionContextProvider>,
    );
  });

  it("should provide state updater functions", () => {
    const expected: Partial<ZaakSelectionContextType> = {
      allPagesSelected: true,
      selectionSize: 3,
      pageSpecificZaakSelection: {
        "https://www.example.com/zaken/1": {
          selected: true,
          detail: { foo: "bar" },
        },
        "https://www.example.com/zaken/2": {
          selected: true,
          detail: { foo: "bar" },
        },
        "https://www.example.com/zaken/3": {
          selected: true,
          detail: { foo: "bar" },
        },
      },
    };

    render(
      <ZaakSelectionContextProvider>
        <TestZaakSelectionContext
          expected={expected}
          callbackParams={{
            setAllPagesSelected: true,
            setSelectionSize: 3,
            setPageSpecificZaakSelection: {
              "https://www.example.com/zaken/1": {
                selected: true,
                detail: { foo: "bar" },
              },
              "https://www.example.com/zaken/2": {
                selected: true,
                detail: { foo: "bar" },
              },
              "https://www.example.com/zaken/3": {
                selected: true,
                detail: { foo: "bar" },
              },
            },
          }}
        />
      </ZaakSelectionContextProvider>,
    );
  });
});
