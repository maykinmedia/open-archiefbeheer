import { AttributeData } from "@maykin-ui/admin-ui";
import { useEffect, useMemo, useState } from "react";
import { useRevalidator } from "react-router-dom";

import {
  ZaakSelection,
  addToZaakSelection,
  getAllZakenSelected,
  getFilteredZaakSelection,
  getZaakSelectionItem,
  getZaakSelectionSize,
  clearZaakSelection as libClearZaakSelection,
  removeFromZaakSelection,
  setAllZakenSelected,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";

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
  zaken: Zaak[],
  filterSelectionZaken?: ZaakSelectionZaakFilter,
  getSelectionDetail?: ZaakSelectionDetailGetter<T>,
): [
  selectedZakenOnPage: Zaak[],
  handleSelect: ZaakSelectionSelectHandler,
  extra: {
    hasSelection: boolean;
    selectionSize: number;
    allPagesSelected: boolean;
    handleSelectAllPages: ZaakSelectionSelectAllPagesHandler;
    clearZaakSelection: ZaakSelectionClearer;
  },
] {
  const revalidator = useRevalidator();

  // All pages selected.
  const [allPagesSelectedState, setAllPagesSelectedState] = useState<boolean>();
  useEffect(() => {
    getAllZakenSelected(storageKey).then((selected) =>
      setAllPagesSelectedState(selected),
    );
  });

  // Has selection items.
  const [hasSelectionState, setHasSelectionState] = useState<boolean>();
  useEffect(() => {
    getFilteredZaakSelection(storageKey).then((zs) =>
      setHasSelectionState(Object.keys(zs).length > 0),
    );
  });

  // Selection count
  const [selectionSizeState, setSelectionSizeState] = useState<number>(0);
  useEffect(() => {
    getZaakSelectionSize(storageKey).then((size) => {
      setSelectionSizeState(size);
    });
  });

  // Selected zaken (on page).
  const [zaakSelectionState, setZaakSelectionState] = useState<
    ZaakSelection<T>
  >({});
  useEffect(() => {
    _updatePageSpecificZaakSelectionState();
  }, [storageKey, zaken.map((z) => z.url as string).join()]);
  const selectedZakenOnPage = useMemo(
    () => zaken.filter((z) => zaakSelectionState[z.url as string]?.selected),
    [zaken, zaakSelectionState],
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
    const zaakUrls = zaken.map((z) => z.url as string);
    const promises = zaakUrls.map((url) =>
      getZaakSelectionItem(storageKey, url),
    );

    Promise.all(promises).then((selectionItems) => {
      const selectedItems = selectionItems
        // Reconstruct tuple with `[url, selectionItem]`.
        .map((selectionItem, i) => {
          const url = zaakUrls[i];
          return [url, selectionItem] as [string, typeof selectionItem];
        })
        // Only keep selected items.
        .filter(([, value]) => value?.selected);

      // Create ZaakSelection from entries.
      const newState = Object.fromEntries(selectedItems) as ZaakSelection<T>;

      // Update state.
      setZaakSelectionState(newState);
    });
  };

  /**
   * @param size
   * @private
   */
  const _optimisticallyUpdateSelectionSizeState = (size: number) => {
    setSelectionSizeState(size);
  };

  /**
   * @param selected
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
        : await filter(zaken, selected, zaakSelectionState);

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
    revalidator.revalidate();
  };

  /**
   * Pass this to `onSelectAll` of a DataGrid component.
   * @param selected
   */
  const onSelectAllPages = async (selected: boolean) => {
    _optimisticallyUpdatePageSpecificZaakSelectionState(zaken, selected);
    _optimisticallyUpdateAllPagesSelectedState(selected);

    await setAllZakenSelected(storageKey, selected);

    _updatePageSpecificZaakSelectionState();
    await _updateAllPagesSelectedState(selected);
    revalidator.revalidate();
  };

  /**
   * Clear the active selection.
   */
  const clearZaakSelection = async () => {
    await libClearZaakSelection(storageKey);
    await _updateAllPagesSelectedState(false);
    setZaakSelectionState({});
    revalidator.revalidate();
  };

  return [
    selectedZakenOnPage,
    onSelect,
    {
      hasSelection: Boolean(hasSelectionState || allPagesSelectedState),
      selectionSize: selectionSizeState,
      allPagesSelected: Boolean(allPagesSelectedState),
      handleSelectAllPages: onSelectAllPages,
      clearZaakSelection: clearZaakSelection,
    },
  ];
}
