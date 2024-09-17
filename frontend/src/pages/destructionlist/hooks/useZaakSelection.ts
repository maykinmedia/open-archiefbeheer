import { AttributeData } from "@maykin-ui/admin-ui";
import { useEffect, useMemo, useState } from "react";
import { useRevalidator } from "react-router-dom";

import {
  ZaakSelection,
  addToZaakSelection,
  getAllZakenSelected,
  getFilteredZaakSelection,
  getZaakSelectionItem,
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

  // Selected zaken (on page).
  const [zaakSelectionState, setZaakSelectionState] = useState<
    ZaakSelection<T>
  >({});
  useEffect(() => _updatePageSpecificZaakSelectionState(), [storageKey, zaken]);
  const selectedZakenOnPage = useMemo(
    () => zaken.filter((z) => zaakSelectionState[z.url as string]?.selected),
    [zaken, zaakSelectionState],
  );

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
    revalidator.revalidate();
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

    _updatePageSpecificZaakSelectionState();
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
    _updateAllPagesSelectedState(selected);
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
      allPagesSelected: Boolean(allPagesSelectedState),
      handleSelectAllPages: onSelectAllPages,
      clearZaakSelection: clearZaakSelection,
    },
  ];
}
