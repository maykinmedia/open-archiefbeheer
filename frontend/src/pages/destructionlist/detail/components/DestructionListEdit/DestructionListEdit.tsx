import { ButtonProps, DataGrid, Outline } from "@maykin-ui/admin-ui";
import React, { useState } from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";
import { useAsync } from "react-use";

import { useSubmitAction } from "../../../../../hooks";
import { canUpdateDestructionList } from "../../../../../lib/auth/permissions";
import {
  ZaakSelection,
  addToZaakSelection,
  getZaakSelection,
} from "../../../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../../../types";
import { useDataGridProps } from "../../../hooks";
import { UpdateDestructionListAction } from "../../DestructionListDetail.action";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";

/**
 * Show items of a destruction list.
 * Allows viewing, adding and removing destruction list items.
 */
export function DestructionListEdit() {
  const { state } = useNavigation();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const submitAction = useSubmitAction();
  const [selectionClearedState, setSelectionClearedState] = useState(false);

  const {
    storageKey,
    destructionList,
    destructionListItems,
    user,
    selectableZaken,
    zaakSelection,
    review,
    reviewItems,
  } = useLoaderData() as DestructionListDetailContext;

  const zakenOnPage = destructionListItems.results
    .map((dt) => dt.zaak)
    .filter((v): v is Zaak => Boolean(v));

  // Zaken on page as ZaakSelection.
  const zakenOnPageSelection: ZaakSelection = zakenOnPage.reduce(
    (acc, val) => ({
      ...acc,
      [val.url as string]: {
        selected: true,
      },
    }),
    {},
  );

  // Whether the user is adding/removing items from the destruction list.
  const isEditingState = !review && Boolean(urlSearchParams.get("is_editing"));

  const handleClearSelection = async () => {
    setSelectionClearedState(true);
  };

  // Get the base props for the DataGrid component.
  const { props: dataGridProps } = useDataGridProps(
    storageKey,
    reviewItems
      ? // FIXME: Accept no/implement real pagination?
        {
          count: reviewItems.length,
          next: null,
          previous: null,
          results: reviewItems.map((ri) => ri.zaak),
        }
      : isEditingState
        ? selectableZaken
        : destructionListItems,
    isEditingState
      ? !selectionClearedState
        ? { ...zakenOnPageSelection, ...zaakSelection } // Current zaken + selection.
        : zaakSelection // Selection explicitly cleared, don't show default zaken.
      : {},
    undefined,
    undefined,
    handleClearSelection,
  );

  /**
   * Gets called when the user clicks the edit button (user intents to adds/remove zaken to/from the destruction list
   * or escape such flow).
   * @param value
   */
  const handleEditSetEditing = (value: boolean) => {
    urlSearchParams.set("page", "1");
    urlSearchParams.set("is_editing", "true");
    setUrlSearchParams(value ? urlSearchParams : {});

    if (!value) {
      setSelectionClearedState(false);
    }
  };

  /**
   * Gets called when the user updates the zaak selection (adds/remove zaken to/from the destruction list).
   */
  const handleEditUpdate = async () => {
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

  // Selection actions allowing the user to add/remove zaken to/from the destruction list or escape such flow.
  const editSelectionActions: ButtonProps[] = isEditingState
    ? [
        {
          children: "Vernietigingslijst aanpassen",
          disabled: ["loading", "submitting"].includes(state),
          onClick: handleEditUpdate,
          variant: "primary",
          wrap: false,
        },
        ...(dataGridProps.selectionActions || []),
        {
          children: "Annuleren",
          disabled: ["loading", "submitting"].includes(state),
          onClick: () => handleEditSetEditing(false),
          wrap: false,
        },
      ]
    : canUpdateDestructionList(user, destructionList)
      ? [
          {
            "aria-label": "Bewerken",
            children: <Outline.PencilIcon />,
            onClick: () => handleEditSetEditing(true),
            wrap: false,
          },
        ]
      : [];

  //
  // RENDERING
  //

  // Update the selected zaken to session storage.
  useAsync(async () => {
    await addToZaakSelection(storageKey, zakenOnPage);
  }, []);

  return (
    <DataGrid
      {...dataGridProps}
      boolProps={{ explicit: true }}
      count={
        isEditingState ? selectableZaken.count : destructionListItems.count
      }
      filterable={isEditingState}
      loading={state === "loading"}
      selectable={Boolean(isEditingState)}
      allowSelectAll={!reviewItems}
      selectionActions={editSelectionActions}
      showPaginator={true}
      sort={isEditingState}
      title="Zaakdossiers"
    />
  );
}
