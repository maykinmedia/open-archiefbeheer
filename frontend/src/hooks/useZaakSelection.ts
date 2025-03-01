import { useContext, useEffect, useMemo, useState } from "react";

import { ZaakSelectionContext } from "../contexts";
import {
  SessionStorageBackend,
  ZaakIdentifier,
  ZaakSelection,
  ZaakSelectionBackend,
  addToZaakSelection,
  compareZaakSelection,
  getAllZakenSelected,
  getZaakSelectionItems,
  getZaakSelectionSize,
  clearZaakSelection as libClearZaakSelection,
  removeFromZaakSelection,
  setAllZakenSelected,
} from "../lib/zaakSelection";

export type ZaakSelectionClearer = () => Promise<void>;

export type ZaakSelectionSelectHandler = (
  zaken: ZaakIdentifier[],
  selected: boolean,
  detail?: object,
) => Promise<void>;

export type ZaakSelectionSelectAllPagesHandler = (
  selected: boolean,
) => Promise<void>;

/**
 * Function returning `Zaak[]` object for `zaken`.
 * Can be used to filter zaken to set selection for.
 */
export type ZaakSelectionZaakFilter<T = unknown> = (
  zaken: ZaakIdentifier[],
  selected: boolean,
  pageSpecificZaakSelection: ZaakSelection<T>,
) => Promise<ZaakIdentifier[]>;

/**
 * Function returning `ZaakSelection` `detail` object for `zaak`.
 * Can be used allow looking up detail object.
 */
export type ZaakSelectionDetailGetter<T = unknown> = (
  zaak: ZaakIdentifier,
  pageSpecificZaakSelection: ZaakSelection,
) => Promise<T>;

/**
 * Hook implementing zaak selection, returns: `[Zaak[], Function, Object]` tuple.
 * "Optimistic updates" are implemented meaning the state is updated ahead of the API calls to improve UX.
 * First items contains the page specific zaak selection.
 * Second item contains the onSelect update function.
 * Third item contains object with additional symbols.
 */
export function useZaakSelection<T = unknown>(
  storageKey: string,
  zakenOnPage: ZaakIdentifier[],
  filterSelectionZaken?: ZaakSelectionZaakFilter<T>,
  getSelectionDetail?: ZaakSelectionDetailGetter<T>,
  backend: ZaakSelectionBackend | null = SessionStorageBackend,
): [
  selectedZakenOnPage: ZaakIdentifier[],
  handleSelect: ZaakSelectionSelectHandler,
  extra: {
    hasSelection: boolean;
    allPagesSelected: boolean;
    selectionSize: number;
    deSelectedZakenOnPage: ZaakIdentifier[];
    zaakSelectionOnPage: ZaakSelection<T>;
    handleSelectAllPages: ZaakSelectionSelectAllPagesHandler;
    clearZaakSelection: ZaakSelectionClearer;
    revalidateZaakSelection: () => void;
  },
] {
  const {
    allPagesSelected,
    setAllPagesSelected,
    selectionSize,
    setSelectionSize,
    pageSpecificZaakSelection,
    setPageSpecificZaakSelection,
  } = useContext(ZaakSelectionContext);

  // extra.revalidateZaakSelection implementation.
  //
  // By calling `extra.revalidateZaakSelection`, `revalidateCount` is update (using a `setRevalidateCount` call), this
  // results in an changed dependency of the `useEffect` hook interacting with the zaakSelection library.
  //
  // This here to allow external observers (`usePoll`) to trigger an update without having to re-implement all calls and
  // update `ZaakSelectionContext`.
  const [revalidateCount, setRevalidateCount] = useState(0);

  // URL of the all zaken on (on page).
  const urls = zakenOnPage.map((z) => z.url as string).join();

  // Get all zaken selected and zaak selection size.
  useEffect(() => {
    if (!backend) return;

    // Fetch all zaken selected
    const getAllZakenSelectedAbortController = new AbortController();
    getAllZakenSelected(storageKey, backend, {
      signal: getAllZakenSelectedAbortController.signal,
    })
      .then((selected) => {
        if (selected !== allPagesSelected) {
          setAllPagesSelected(selected);
        }
      })
      .catch(_catchAbortError);

    // Fetch selection size.
    const getZaakSelectionSizeAbortController = new AbortController();
    getZaakSelectionSize(storageKey, backend, {
      signal: getZaakSelectionSizeAbortController.signal,
    })
      .then((size) => {
        if (size !== selectionSize) {
          setSelectionSize(size);
        }
      })
      .catch(_catchAbortError);

    // Fetch new selection.
    const getZaakSelectionItemsAbortController = new AbortController();
    _updatePageSpecificZaakSelectionState(
      getZaakSelectionItemsAbortController.signal,
    );

    return () => {
      getAllZakenSelectedAbortController.abort();
      getZaakSelectionSizeAbortController.abort();
      getZaakSelectionItemsAbortController.abort();
    };
  }, [storageKey, urls, revalidateCount]);

  // Memoize selected zaken on page.
  const selectedZakenOnPage = useMemo(
    () =>
      zakenOnPage.filter(
        (z) => pageSpecificZaakSelection[z.url as string]?.selected,
      ),
    [zakenOnPage, pageSpecificZaakSelection],
  );

  // Memoize deselected zaken on page.
  const deSelectedZakenOnPage = useMemo(
    () =>
      zakenOnPage.filter(
        (z) => pageSpecificZaakSelection[z.url as string]?.selected === false, // Explicitly checking for false.
      ),
    [zakenOnPage, pageSpecificZaakSelection],
  );

  /**
   * @param selected
   * @private
   */
  const _optimisticallyUpdateAllPagesSelectedState = (selected: boolean) => {
    setAllPagesSelected(selected);
  };

  /**
   * @param selected
   * @private
   */
  const _updateAllPagesSelectedState = async (selected: boolean) => {
    await setAllZakenSelected(storageKey, selected);
    const _selected = await getAllZakenSelected(storageKey);
    setAllPagesSelected(_selected);
  };

  /**
   * @param zaken
   * @param selected
   * @private
   */
  const _optimisticallyUpdatePageSpecificZaakSelectionState = (
    zaken: ZaakIdentifier[],
    selected: boolean,
  ) => {
    const optimisticSelection = zaken.reduce((selection, zaak) => {
      return { ...selection, [zaak.url as string]: { selected } };
    }, pageSpecificZaakSelection);
    setPageSpecificZaakSelection(optimisticSelection);
  };

  /**
   * TODO: Optimize
   * @private
   */
  const _updatePageSpecificZaakSelectionState = async (
    signal?: AbortSignal,
  ) => {
    if (!backend) return;

    // Get selection item for every zaak on page.
    const zaakUrls = zakenOnPage.map((z) => z.url as string);
    const newState = await getZaakSelectionItems<T>(
      storageKey,
      zaakUrls,
      false,
      backend,
      { signal },
    ).catch(_catchAbortError);

    if (!newState) {
      return;
    }

    // Update state.
    const hasChanged = !compareZaakSelection(
      pageSpecificZaakSelection,
      newState,
    );

    if (hasChanged) {
      setPageSpecificZaakSelection(newState);
    }
  };

  /**
   * Catches `error` if `error.name==="AbortError".
   * @param error
   */
  const _catchAbortError = (error: Error) => {
    if (error.name === "AbortError") {
      return;
    }
    throw error;
  };

  /**
   * @param size
   * @private
   */
  const _optimisticallyUpdateSelectionSizeState = (size: number) => {
    setSelectionSize(size);
  };

  /**
   * @private
   */
  const _updateSelectionSizeState = async () => {
    const size = await getZaakSelectionSize(storageKey);
    setSelectionSize(size);
  };

  /**
   * Pass this to `onSelect` of a DataGrid component.
   * @param zaken
   * @param selected
   * @param detail If called directly (not as callback for DataGrid), `detail`
   *   can be passed directly, use `getSelectionDetail` otherwise.
   */
  const onSelect = async (
    zaken: ZaakIdentifier[],
    selected: boolean,
    detail?: object,
  ) => {
    if (!backend) return;

    _optimisticallyUpdatePageSpecificZaakSelectionState(zaken, selected);
    _optimisticallyUpdateSelectionSizeState(
      selected ? selectionSize + 1 : selectionSize - 1,
    );

    const filter = filterSelectionZaken
      ? filterSelectionZaken
      : (zaken: ZaakIdentifier[]) => {
          return zaken;
        };

    const filteredZaken = selected
      ? await filter(
          zaken,
          selected,
          pageSpecificZaakSelection as ZaakSelection<T>,
        )
      : zaken.length
        ? await filter(
            zaken,
            selected,
            pageSpecificZaakSelection as ZaakSelection<T>,
          )
        : await filter(
            zakenOnPage,
            selected,
            pageSpecificZaakSelection as ZaakSelection<T>,
          );

    const detailPromises = detail
      ? [detail]
      : getSelectionDetail
        ? filteredZaken.map((z) =>
            getSelectionDetail(z, pageSpecificZaakSelection),
          )
        : undefined;
    const detailArray = detailPromises
      ? await Promise.all(detailPromises)
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    selected
      ? await addToZaakSelection(
          storageKey,
          filteredZaken,
          detailArray,
          backend,
        )
      : await removeFromZaakSelection(storageKey, filteredZaken, backend);

    await _updatePageSpecificZaakSelectionState();
    await _updateSelectionSizeState();
  };

  /**
   * Pass this to `onSelectAll` of a DataGrid component.
   * @param selected
   */
  const onSelectAllPages = async (selected: boolean) => {
    if (!backend) return;

    _optimisticallyUpdatePageSpecificZaakSelectionState(zakenOnPage, selected);
    _optimisticallyUpdateAllPagesSelectedState(selected);

    await setAllZakenSelected(storageKey, selected, backend);

    _updatePageSpecificZaakSelectionState();
    await _updateAllPagesSelectedState(selected);
  };

  /**
   * Clear the active selection.
   */
  const clearZaakSelection = async () => {
    if (!backend) return;

    await libClearZaakSelection(storageKey, backend);
    await _updateAllPagesSelectedState(false);
    setPageSpecificZaakSelection({});
    setSelectionSize(0);
  };

  return [
    selectedZakenOnPage,
    onSelect,
    {
      hasSelection: Boolean(selectionSize || allPagesSelected),
      allPagesSelected: Boolean(allPagesSelected),
      selectionSize: selectionSize,
      deSelectedZakenOnPage,
      zaakSelectionOnPage: pageSpecificZaakSelection as ZaakSelection<T>,
      handleSelectAllPages: onSelectAllPages,
      clearZaakSelection: clearZaakSelection,
      revalidateZaakSelection: () => setRevalidateCount(revalidateCount + 1),
    },
  ];
}
