import { DataGrid, Outline } from "@maykin-ui/admin-ui";
import React, { useState } from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router-dom";
import { useAsync } from "react-use";

import {
  addToZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { useDataGridProps } from "../hooks";
import "./DestructionListDetail.css";
import { DestructionListDetailContext } from "./types";

export function DestructionListItems() {
  const { state } = useNavigation();
  const { storageKey, allZaken, zaken, zaakSelection } =
    useLoaderData() as DestructionListDetailContext;
  const submit = useSubmit();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const isEditingState = Boolean(urlSearchParams.get("is_editing"));
  const selectedUrls = Object.entries(zaakSelection)
    .filter(([_, { selected }]) => selected)
    .map(([url]) => ({ url }));
  const dataGridProps = useDataGridProps(
    storageKey,
    isEditingState ? allZaken : zaken,
    isEditingState ? [...zaken.results, ...selectedUrls] : [],
  );

  useAsync(async () => {
    await addToZaakSelection(storageKey, zaken.results);
  }, []);

  const onUpdate = async () => {
    const zaakSelection = await getZaakSelection(storageKey);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selection]) => selection.selected)
      .map(([url]) => url);

    const formData = new FormData();
    zaakUrls.forEach((url) => formData.append("zaakUrls", url));

    submit(formData, { method: "PATCH" });
  };

  const setIsEditing = (value: boolean) => {
    urlSearchParams.set("page", "1");
    value
      ? urlSearchParams.set("is_editing", "true")
      : urlSearchParams.delete("is_editing");
    setUrlSearchParams(urlSearchParams);
  };

  return (
    <div className="zaken-list">
      <DataGrid
        {...dataGridProps.props}
        boolProps={{ explicit: true }}
        count={isEditingState ? allZaken.count : zaken.count}
        filterable={isEditingState}
        loading={state === "loading"}
        selectable={isEditingState}
        selectionActions={
          isEditingState
            ? [
                {
                  children: "Vernietigingslijst aanpassen",
                  onClick: onUpdate,
                  wrap: false,
                },
                {
                  children: "Annuleren",
                  onClick: () => setIsEditing(false),
                  wrap: false,
                },
              ]
            : [
                {
                  "aria-label": "bewerken",
                  children: <Outline.PencilIcon />,
                  onClick: () => setIsEditing(true),
                  wrap: false,
                },
              ]
        }
        sort={isEditingState}
        title="Zaakdossiers"
      />
    </div>
  );
}
