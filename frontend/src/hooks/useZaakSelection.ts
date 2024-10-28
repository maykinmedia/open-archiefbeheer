import { AttributeData } from "@maykin-ui/admin-ui";
import { useEffect, useMemo, useState } from "react";

import {
  ZaakSelection,
  addToZaakSelection,
  getAllZakenSelected,
  getZaakSelectionItem,
  getZaakSelectionSize,
  clearZaakSelection as libClearZaakSelection,
  removeFromZaakSelection,
  setAllZakenSelected,
} from "../lib/zaakSelection/zaakSelection";
import { Zaak } from "../types";

export type ZaakSelectionClearer = () => Promise<void>;

export type ZaakSelectionSelectHandler = (
  attributeData: AttributeData[],
  selected: boolean,
) => Promise<void>;

export type ZaakSelectionSelectAllPagesHandler = (
  selected: boolean,
) => Promise<void>;

export type ZaakSelectionZaakFilter = (
  zaken: Zaak[],
  selected: boolean,
  pageSpecificZaakSelection: ZaakSelection,
) => Promise<Zaak[]>;

export type ZaakSelectionDetailGetter<T = unknown> = (
  zaak: Zaak,
  pageSpecificZaakSelection: ZaakSelection,
) => Promise<T>;

/**
 * Hook implementing zaak selection, returns: `[AttributeData[], Function, Object]` tuple.
 * First items contains the page specific zaak selection.
 * Second item contains the onSelect update function.
 * Third item contains object with additional symbols.
 */
export function useZaakSelection<T = unknown>(
  storageKey: string,
  zakenOnPage: Zaak[],
  filterSelectionZaken?: ZaakSelectionZaakFilter,
  getSelectionDetail?: ZaakSelectionDetailGetter<T>,
): [
  selectedZakenOnPage: Zaak[],
  handleSelect: ZaakSelectionSelectHandler,
  extra: {
    hasSelection: boolean;
    allPagesSelected: boolean;
    selectionSize: number;
    deSelectedZakenOnPage: Zaak[];
    zaakSelectionOnPage: ZaakSelection<T>;
    handleSelectAllPages: ZaakSelectionSelectAllPagesHandler;
    clearZaakSelection: ZaakSelectionClearer;
  },
] {
  // All pages selected.
  const [allPagesSelectedState, setAllPagesSelectedState] = useState<boolean>();

  // Selection count
  const [selectionSizeState, setSelectionSizeState] = useState<number>(0);

  // Selected zaken (on page).
  const [zaakSelectionState, setZaakSelectionState] = useState<
    ZaakSelection<T>
  >({});

  // TODO: ABORT CONTROLLERS IF MIGRATING TO REST API?
  useEffect(() => {
    getAllZakenSelected(storageKey).then((selected) => {
      if (selected !== allPagesSelectedState) {
        setAllPagesSelectedState(selected);
      }
    });

    getZaakSelectionSize(storageKey).then((size) => {
      if (size !== selectionSizeState) {
        setSelectionSizeState(size);
      }
    });
  });

  useEffect(() => {
    _updatePageSpecificZaakSelectionState();
  }); // Deps removed to allow responding to changes (from actions?)

  const selectedZakenOnPage = useMemo(
    () =>
      zakenOnPage.filter((z) => zaakSelectionState[z.url as string]?.selected),
    [zakenOnPage, zaakSelectionState],
  );
  const deSelectedZakenOnPage = useMemo(
    () =>
      zakenOnPage.filter(
        (z) => zaakSelectionState[z.url as string]?.selected === false, // Explicitly checking for false.
      ),
    [zakenOnPage, zaakSelectionState],
  );

  /**
   * @param selected
   * @private
   */
  const _optimisticallyUpdateAllPagesSelectedState = (selected: boolean) => {
    setAllPagesSelectedState(selected);
  };

  /**
   * @param selected
   * @private
   */
  const _updateAllPagesSelectedState = async (selected: boolean) => {
    await setAllZakenSelected(storageKey, selected);
    const _selected = await getAllZakenSelected(storageKey);
    setAllPagesSelectedState(_selected);
  };

  /**
   * @param zaken
   * @param selected
   * @private
   */
  const _optimisticallyUpdatePageSpecificZaakSelectionState = (
    zaken: Zaak[],
    selected: boolean,
  ) => {
    const optimisticSelection = zaken.reduce((selection, zaak) => {
      return { ...selection, [zaak.url as string]: { selected } };
    }, zaakSelectionState);
    setZaakSelectionState(optimisticSelection);
  };

  /**
   * TODO: Optimize
   * @private
   */
  const _updatePageSpecificZaakSelectionState = () => {
    // Get selection item for every zaak on page.
    const zaakUrls = zakenOnPage.map((z) => z.url as string);
    const promises = zaakUrls.map((url) =>
      getZaakSelectionItem(storageKey, url, false),
    );

    Promise.all(promises).then((selectionItems) => {
      const selectedItems = selectionItems
        // Reconstruct tuple with `[url, selectionItem]`.
        .map((selectionItem, i) => {
          const url: string = zaakUrls[i];
          return [url, selectionItem] as [string, typeof selectionItem];
        })
        .filter(([, value]) => typeof value?.selected === "boolean");

      // Create ZaakSelection from entries.
      const newState = Object.fromEntries(selectedItems) as ZaakSelection<T>;

      // Update state.
      const oldUrls = _serializeSelection(zaakSelectionState);
      const newUrls = _serializeSelection(newState);

      if (oldUrls !== newUrls) {
        setZaakSelectionState(newState);
      }
    });
  };

  const _serializeSelection = (selection: ZaakSelection): string => {
    return Object.entries(selection)
      .map(([url, { selected, detail }]) => {
        const json = detail ? JSON.stringify(detail) : "";
        return `${url}${selected}${json}`;
      })
      .join();
  };

  /**
   * @param size
   * @private
   */
  const _optimisticallyUpdateSelectionSizeState = (size: number) => {
    setSelectionSizeState(size);
  };

  /**
   * @private
   */
  const _updateSelectionSizeState = async () => {
    const size = await getZaakSelectionSize(storageKey);
    setSelectionSizeState(size);
  };

  /**
   * Pass this to `onSelect` of a DataGrid component.
   * @param attributeData
   * @param selected
   */
  const onSelect = async (
    attributeData: AttributeData[],
    selected: boolean,
  ) => {
    const _zaken = attributeData as unknown as Zaak[];
    _optimisticallyUpdatePageSpecificZaakSelectionState(_zaken, selected);
    _optimisticallyUpdateSelectionSizeState(
      selected ? selectionSizeState + 1 : selectionSizeState - 1,
    );

    const filter = filterSelectionZaken
      ? filterSelectionZaken
      : (zaken: Zaak[]) => {
          return zaken;
        };

    const filteredZaken = selected
      ? await filter(
          attributeData as unknown as Zaak[],
          selected,
          zaakSelectionState,
        )
      : attributeData.length
        ? await filter(
            attributeData as unknown as Zaak[],
            selected,
            zaakSelectionState,
          )
        : await filter(zakenOnPage, selected, zaakSelectionState);

    const detailPromises = getSelectionDetail
      ? filteredZaken.map((z) => getSelectionDetail(z, zaakSelectionState))
      : undefined;
    const detailArray = detailPromises
      ? await Promise.all(detailPromises)
      : undefined;

    selected
      ? await addToZaakSelection(storageKey, filteredZaken, detailArray)
      : await removeFromZaakSelection(storageKey, filteredZaken);

    await _updatePageSpecificZaakSelectionState();
    await _updateSelectionSizeState();
  };

  /**
   * Pass this to `onSelectAll` of a DataGrid component.
   * @param selected
   */
  const onSelectAllPages = async (selected: boolean) => {
    _optimisticallyUpdatePageSpecificZaakSelectionState(zakenOnPage, selected);
    _optimisticallyUpdateAllPagesSelectedState(selected);

    await setAllZakenSelected(storageKey, selected);

    _updatePageSpecificZaakSelectionState();
    await _updateAllPagesSelectedState(selected);
  };

  /**
   * Clear the active selection.
   */
  const clearZaakSelection = async () => {
    await libClearZaakSelection(storageKey);
    await _updateAllPagesSelectedState(false);
    setZaakSelectionState({});
  };

  return [
    selectedZakenOnPage,
    onSelect,
    {
      hasSelection: Boolean(selectionSizeState || allPagesSelectedState),
      allPagesSelected: Boolean(allPagesSelectedState),
      selectionSize: selectionSizeState,
      deSelectedZakenOnPage,
      zaakSelectionOnPage: zaakSelectionState,
      handleSelectAllPages: onSelectAllPages,
      clearZaakSelection: clearZaakSelection,
    },
  ];
}
