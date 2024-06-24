import { DataGrid, Outline } from "@maykin-ui/admin-ui";
import React from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router-dom";
import { useAsync } from "react-use";

import { ReviewItem } from "../../../lib/api/review";
import {
  addToZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { useDataGridProps } from "../hooks";
import "./DestructionListDetail.css";
import { DestructionListDetailContext } from "./types";

export function DestructionListItems() {
  const { state } = useNavigation();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const submit = useSubmit();
  const {
    storageKey,
    zaken,
    selectableZaken,
    zaakSelection,
    review,
    reviewItems,
  } = useLoaderData() as DestructionListDetailContext;

  const isEditingState = !review && Boolean(urlSearchParams.get("is_editing"));

  const selectedUrls = Object.entries(zaakSelection)
    .filter(([_, { selected }]) => selected)
    .map(([url]) => ({ url }));

  const dataGridProps = useDataGridProps(
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
        : zaken,
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
    <DataGrid
      {...dataGridProps.props}
      boolProps={{ explicit: true }}
      count={isEditingState ? selectableZaken.count : zaken.count}
      filterable={isEditingState}
      loading={state === "loading"}
      allowSelectAll={!reviewItems}
      selectable={Boolean(reviewItems || isEditingState)}
      selectionActions={
        review
          ? undefined
          : isEditingState
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
      showPaginator={!reviewItems}
      sort={isEditingState}
      title="Zaakdossiers"
    />
  );
}
