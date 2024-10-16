import { ButtonProps, Solid, TypedField } from "@maykin-ui/admin-ui";
import React, { useMemo, useState } from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

import { ProcessingStatusBadge } from "../../../../../components";
import { useSubmitAction } from "../../../../../hooks";
import { PaginatedDestructionListItems } from "../../../../../lib/api/destructionListsItem";
import { ProcessingStatus } from "../../../../../lib/api/processingStatus";
import { PaginatedZaken } from "../../../../../lib/api/zaken";
import { getZaakSelection } from "../../../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../../../types";
import { BaseListView } from "../../../abstract";
import { UpdateDestructionListAction } from "../../DestructionListDetail.action";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { useSecondaryNavigation } from "../../hooks/useSecondaryNavigation";

/**
 * Show items of a destruction list.
 * Allows viewing, adding and removing destruction list items.
 */
export function DestructionListEdit() {
  const { destructionList, destructionListItems, selectableZaken, storageKey } =
    useLoaderData() as DestructionListDetailContext;

  const [selectionClearedState, setSelectionClearedState] = useState(false);
  const { state } = useNavigation();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const submitAction = useSubmitAction();
  const secondaryNavigationItems = useSecondaryNavigation();

  // Whether the list is in edit mode.
  const editingState = useMemo(
    () =>
      destructionList.status === "new" &&
      Boolean(urlSearchParams.get("is_editing")),
    [destructionList.status, urlSearchParams],
  );

  // The initially select items.
  const initiallySelectedZakenOnPage = useMemo(
    () =>
      selectionClearedState
        ? []
        : paginatedDestructionListItems2paginatedZaken(destructionListItems)
            .results,
    [selectionClearedState, destructionListItems],
  );

  // Whether extra fields should be rendered.
  const extraFields: TypedField[] = useMemo(
    () =>
      !editingState && destructionList.processingStatus !== "new"
        ? [
            {
              name: "processingStatus",
              type: "string",
              options: [
                { label: "New", value: "new" },
                { label: "Queued", value: "queued" },
                { label: "Processing", value: "processing" },
                { label: "Failed", value: "failed" },
                { label: "Succeeded", value: "succeeded" },
              ],
              width: "180px",
              valueTransform: (data) => (
                <ProcessingStatusBadge
                  processingStatus={data.processingStatus as ProcessingStatus}
                />
              ),
            },
          ]
        : [],
    [editingState, destructionList],
  );

  // DataGrid (paginated) results based on `editingState`.
  const paginatedZaken = useMemo<PaginatedZaken>(() => {
    if (editingState) {
      return selectableZaken;
    }
    return paginatedDestructionListItems2paginatedZaken(destructionListItems);
  }, [destructionListItems, selectableZaken, editingState]);

  // Selection actions based on `editingState`.
  const selectionActions: ButtonProps[] = useMemo(
    () =>
      editingState
        ? [
            {
              children: (
                <>
                  <Solid.PencilIcon />
                  Vernietigingslijst aanpassen
                </>
              ),
              disabled: ["loading", "submitting"].includes(state),
              variant: "primary",
              wrap: false,
              onClick: () => handleUpdate(),
            },
            {
              children: (
                <>
                  <Solid.NoSymbolIcon />
                  Annuleren
                </>
              ),
              disabled: false, // Set explicitly to prevent automatic value based on selection presence.
              wrap: false,
              onClick: () => handleSetEditing(false),
            },
          ]
        : destructionList.status === "new"
          ? [
              {
                children: (
                  <>
                    <Solid.PencilIcon />
                    Bewerken
                  </>
                ),
                wrap: false,
                onClick: () => handleSetEditing(true),
              },
            ]
          : [],
    [editingState, state],
  );

  /**
   * Gets called when the user clicks the edit button (user intents to adds/remove zaken to/from the destruction list
   * or escape such flow).
   * @param value
   */
  const handleSetEditing = (value: boolean) => {
    urlSearchParams.set("page", "1");
    urlSearchParams.set("is_editing", "true");
    setUrlSearchParams(value ? urlSearchParams : {});

    if (!value) {
      setSelectionClearedState(false);
    }
  };

  /**
   * Gets called when te selection is cleared.
   */
  const handleClearSelection = async () => {
    setSelectionClearedState(true);
  };

  /**
   * Gets called when the user updates the zaak selection (adds/remove zaken to/from the destruction list).
   */
  const handleUpdate = async () => {
    const zaakSelection = await getZaakSelection(storageKey);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selection]) => selection.selected)
      .map(([url]) => url);

    const action: UpdateDestructionListAction<Record<string, string[]>> = {
      type: "UPDATE_ZAKEN",
      payload: {
        zaakUrls,
      },
    };
    submitAction(action);
  };

  return (
    <BaseListView
      destructionList={destructionList}
      extraFields={extraFields}
      initiallySelectedZakenOnPage={initiallySelectedZakenOnPage}
      paginatedZaken={paginatedZaken}
      secondaryNavigationItems={secondaryNavigationItems}
      selectable={editingState}
      selectionActions={selectionActions}
      sortable={false}
      storageKey={storageKey}
      onClearZaakSelection={handleClearSelection}
    ></BaseListView>
  );
}

/**
 * Converts `PaginatedDestructionListItems` to `PaginatedZaken`.
 */
function paginatedDestructionListItems2paginatedZaken(
  paginatedDestructionListItems: PaginatedDestructionListItems,
): PaginatedZaken {
  return {
    ...paginatedDestructionListItems,
    results: paginatedDestructionListItems.results
      .map((dli) => ({ ...dli.zaak, processingStatus: dli.processingStatus }))
      // @ts-expect-error - FIXME: Adding "processingStatus" to zaak.
      .filter((v): v is Zaak => Boolean(v)) as Zaak[],
  };
}
