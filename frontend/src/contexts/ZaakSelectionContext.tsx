import React, { createContext, useState } from "react";

import { ZaakSelection } from "../lib/zaakSelection";

export type ZaakSelectionContextType<T = unknown> = {
  allPagesSelected: boolean;
  setAllPagesSelected: (allPagesSelected: boolean) => void;
  selectionSize: number;
  setSelectionSize: (selectionSize: number) => void;
  pageSpecificZaakSelection: ZaakSelection<T>;
  setPageSpecificZaakSelection: (
    pageSpecificZaakSelection: ZaakSelection<T>,
  ) => void;
};

export const DEFAULT_ZAAK_SELECTION_CONTEXT = {
  allPagesSelected: false,
  setAllPagesSelected: () => undefined,
  selectionSize: 0,
  setSelectionSize: () => undefined,
  pageSpecificZaakSelection: {},
  setPageSpecificZaakSelection: () => undefined,
};

export const ZaakSelectionContext = createContext<ZaakSelectionContextType>(
  DEFAULT_ZAAK_SELECTION_CONTEXT,
);

/**
 * Implements `ZaakSelectionContext.Provider` and supplies `useState()` based
 *  values.
 * @param children
 * @constructor
 */
export function ZaakSelectionContextProvider({
  children,
}: React.PropsWithChildren) {
  const [allPagesSelected, setAllPagesSelected] = useState<boolean>(false);
  const [selectionSize, setSelectionSize] = useState<number>(0);
  const [pageSpecificZaakSelection, setPageSpecificZaakSelection] =
    useState<ZaakSelection>({});

  return (
    <ZaakSelectionContext.Provider
      value={{
        allPagesSelected,
        setAllPagesSelected,
        selectionSize,
        setSelectionSize,
        pageSpecificZaakSelection,
        setPageSpecificZaakSelection,
      }}
    >
      {children}
    </ZaakSelectionContext.Provider>
  );
}
