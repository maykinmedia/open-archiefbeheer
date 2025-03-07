import {
  Context,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
} from "react";

import { ZaakSelectionContext, ZaakSelectionContextType } from "../contexts";
import {
  SessionStorageBackend,
  ZaakIdentifier,
  ZaakSelection,
  ZaakSelectionBackend,
  addToZaakSelection,
  getAllZakenSelected,
  getZaakSelectionItems,
  getZaakSelectionSize,
  clearZaakSelection as libClearZaakSelection,
  removeFromZaakSelection,
  setAllZakenSelected,
} from "../lib/zaakSelection";

export type ZaakSelectionClearer = () => Promise<void>;

export type ZaakSelectionSelectHandler<T = unknown> = (
  zaken: ZaakIdentifier[],
  selected: boolean,
  detail?: T,
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
  handleSelect: ZaakSelectionSelectHandler<T>,
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
  // Context state machines.
  const {
    allPagesSelected,
    setAllPagesSelected,
    selectionSize,
    setSelectionSize,
    pageSpecificZaakSelection,
    setPageSpecificZaakSelection,
  } = useContext<ZaakSelectionContextType<T>>(
    ZaakSelectionContext as Context<ZaakSelectionContextType<T>>,
  );

  // extra.revalidateZaakSelection implementation.
  //
  // By calling `extra.revalidateZaakSelection`, `revalidateCount` is update (using a `setRevalidateCount` call), this
  // results in an changed dependency of the `useEffect` hook interacting with the zaakSelection library.
  //
  // This here to allow external observers (`usePoll`) to trigger an update without having to re-implement all calls and
  // update `ZaakSelectionContext`.
  const [revalidateCount, setRevalidateCount] = useState(0);

  // Optimistic selection state management:
  //
  // `optimisticSelection` represents the current selection state, including pending updates
  // that may not yet be confirmed by the backend, ensuring a responsive UI experience.
  //
  // `optimisticSelectionUpdate` should be used within a transition to update the selection state
  // optimistically. The backend update must be triggered explicitly within the same transition.
  //
  // Behavior:
  // - The transition action is an **asynchronous function** executed inside `startTransition`.
  // - If the action completes (i.e., promise resolves), the optimistic state is replaced with the actual state.
  // - If the backend update succeeds (and the actual state is updated), the optimistic value typically remains unchanged.
  // - If the backend update fails (the promise rejects and the actual state is not updated), the optimistic value is rolled back to the previous state.
  //
  // Usage:
  // - The selection state is stored per `zaak.url`.
  // - Each `zaak` can have a `selected` status and an optional `detail`.
  // - Updates are applied optimistically to ensure UI responsiveness while awaiting backend confirmation.
  // - The backend update should be manually triggered within the transition to keep state in sync.
  // - Error handling should be implemented to revert or correct the state if the action fails.
  //
  // Example:
  // ```tsx
  // startTransition(async () => {
  //   optimisticSelectionUpdate({ zaken, selected, detail });
  //   optimisticSelectionSizeUpdate({ selected });
  //
  //   try {
  //     await persist(zaken, selected, detail);
  //     await _updatePageSpecificZaakSelectionState();
  //     await _updateSelectionSizeState();
  //   } catch (e) {
  //     // On failure, the optimistic updates are rolled back to the previous state.
  //     console.warn(e);
  //   }
  // });
  // ```

  // Action type for use `UpdateSelectionAction`.
  type ZaakSelectionAction = {
    zaken: ZaakIdentifier[];
    selected: boolean;
    detail?: T;
  };

  // Action type for use `UpdateSelectionSizeAction`.
  type SelectionAction = {
    selected: boolean;
  };

  // `optimisticSelection` logic`.
  const [optimisticSelection, optimisticSelectionUpdate] = useOptimistic(
    pageSpecificZaakSelection,
    (state, { zaken, selected, detail }: ZaakSelectionAction) => {
      return zaken.reduce(
        (selection, zaak) => ({
          ...selection,
          [zaak.url as string]: { selected, detail },
        }),
        state,
      );
    },
  );

  // `optimisticSelectionSize` logic.
  const [optimisticSelectionSize, optimisticSelectionSizeUpdate] =
    useOptimistic(selectionSize, (state, { selected }: SelectionAction) =>
      selected ? selectionSize + 1 : selectionSize - 1,
    );

  // `optimisticSelectAll` logic.
  const [optimisticAllPagesSelected, optimisticAllPagesSelectedUpdate] =
    useOptimistic(
      allPagesSelected,
      (_, { selected }: SelectionAction) => selected,
    );

  /**
   * Select handler, pass this to `onSelect` of a DataGrid component.
   *
   * @param zaken - The user selected zaken.
   * @param selected - Whether `zaken` should be selected.
   * @param detail - If called directly (not as callback for DataGrid): `detail`
   *   can be passed directly, use `getSelectionDetail` otherwise.
   */
  const onSelect = async (
    zaken: ZaakIdentifier[],
    selected: boolean,
    detail?: T,
  ) => {
    if (!backend) return;

    startTransition(async () => {
      optimisticSelectionUpdate({ zaken, selected, detail });
      optimisticSelectionSizeUpdate({ selected });

      try {
        await persist(zaken, selected, detail);
        await _updatePageSpecificZaakSelectionState();
        await _updateSelectionSizeState();
      } catch (e) {
        // If the transition fails (i.e. the backend update rejects), the actual state remains unchanged.
        // This causes the optimistic updates to be overridden (rolled back) by the actual state.
        // We only log the error here without showing any user-facing error messages.
        console.warn(e);
      }
    });
  };

  /**
   * Persists the zaak selection to the backend.
   *
   * @param zaken - The user selected zaken.
   * @param selected - Whether `zaken` should be selected.
   * @param detail - If called directly (not as callback for DataGrid): `detail`
   *   can be passed directly, use ``getSelectionDetail` otherwise.
   */
  const persist = async (
    zaken: ZaakIdentifier[],
    selected: boolean,
    detail?: T,
  ) => {
    if (!backend) return;

    const filteredZaken = await getFilteredZaken(zaken, selected);

    if (selected) {
      const detailArray = await getDetailArray(filteredZaken, detail);
      await addToZaakSelection(storageKey, filteredZaken, detailArray, backend);
    } else {
      await removeFromZaakSelection(storageKey, filteredZaken, backend);
    }
  };

  /**
   * Filters the zaak selection using an optionally passed filter.
   *
   * @param zaken - The user selected zaken.
   * @param selected - Whether `zaken` should be selected.
   */
  const getFilteredZaken = async (
    zaken: ZaakIdentifier[],
    selected: boolean,
  ) => {
    if (!filterSelectionZaken) {
      return zaken.length ? zaken : zakenOnPage;
    }

    // If no zaken are passed, and no selection is made, default to `zakenOnPage` (deselect all).
    const zakenToFilter = zaken.length || selected ? zaken : zakenOnPage;

    return await filterSelectionZaken(
      zakenToFilter,
      selected,
      pageSpecificZaakSelection,
    );
  };

  /**
   * Returns a `Promise<T[]>` for detail objects for `filtered` zaken.
   *
   * @param filteredZaken - Filtered zaken (using `getFilteredZaken`).
   * @param detail - If passed: return `detail` directly (as array).
   */
  const getDetailArray = async (
    filteredZaken: ZaakIdentifier[],
    detail?: T,
  ): Promise<T[] | undefined> => {
    // Us provided detail.
    if (detail) {
      return [detail];
    }

    // Use provided getter.
    if (getSelectionDetail) {
      const promises = filteredZaken.map((z) =>
        getSelectionDetail(z, pageSpecificZaakSelection),
      );
      return await Promise.all(promises);
    }
  };

  // Get all zaken selected and zaak selection size.
  useEffect(() => {
    if (!backend) return;

    // Fetch all zaken selected
    const getAllZakenSelectedAbortController = new AbortController();
    getAllZakenSelected(storageKey, backend, {
      signal: getAllZakenSelectedAbortController.signal,
    })
      .then((selected) => {
        if (selected !== optimisticAllPagesSelected) {
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
        if (size !== optimisticSelectionSize) {
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
  }, [
    storageKey,
    revalidateCount,
    zakenOnPage.map((z) => z.url as string).join(),
  ]);

  // Memoize selected zaken on page.
  const selectedZakenOnPage = useMemo(
    () =>
      zakenOnPage.filter((z) => optimisticSelection[z.url as string]?.selected),
    [zakenOnPage, optimisticSelection],
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
   * @param selected - Whether `zaken` should be selected.
   * @private
   */
  const _updateAllPagesSelectedState = async (selected: boolean) => {
    await setAllZakenSelected(storageKey, selected);
    const _selected = await getAllZakenSelected(storageKey);
    setAllPagesSelected(_selected);
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

    setPageSpecificZaakSelection(newState);
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
   * @private
   */
  const _updateSelectionSizeState = async () => {
    const size = await getZaakSelectionSize(storageKey);
    setSelectionSize(size);
  };

  /**
   * Pass this to `onSelectAll` of a DataGrid component.
   * @param selected - Whether `zaken` should be selected.
   */
  const onSelectAllPages = async (selected: boolean) => {
    if (!backend) return;

    startTransition(async () => {
      optimisticSelectionUpdate({ zaken: zakenOnPage, selected });
      optimisticAllPagesSelectedUpdate({ selected });

      await setAllZakenSelected(storageKey, selected, backend);
      _updatePageSpecificZaakSelectionState();
      await _updateAllPagesSelectedState(selected);
    });
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

  if (!backend) {
    return [
      [],
      async () => undefined,
      {
        hasSelection: false,
        allPagesSelected: false,
        selectionSize: 0,
        deSelectedZakenOnPage: [],
        zaakSelectionOnPage: {},
        handleSelectAllPages: async () => undefined,
        clearZaakSelection: async () => undefined,
        revalidateZaakSelection: () => undefined,
      },
    ];
  }

  return [
    selectedZakenOnPage,
    onSelect,
    {
      hasSelection: Boolean(selectionSize || optimisticAllPagesSelected),
      allPagesSelected: Boolean(optimisticAllPagesSelected),
      selectionSize: optimisticSelectionSize,
      deSelectedZakenOnPage,
      zaakSelectionOnPage: optimisticSelection as ZaakSelection<T>,
      handleSelectAllPages: onSelectAllPages,
      clearZaakSelection: clearZaakSelection,
      revalidateZaakSelection: () => setRevalidateCount(revalidateCount + 1),
    },
  ];
}
