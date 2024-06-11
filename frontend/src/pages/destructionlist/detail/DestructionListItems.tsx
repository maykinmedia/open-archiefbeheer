import { DataGrid, Outline } from "@maykin-ui/admin-ui";
import React, { useState } from "react";
import { useLoaderData, useNavigation, useSubmit } from "react-router-dom";
import { useAsync } from "react-use";

import {
  addToZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { useDataGridProps } from "../hooks";
import "./DestructionListDetail.css";
import { DestructionListData, DestructionListDetailContext } from "./types";

export type DestructionListItemsProps = {
  zaken: Zaak[];
  destructionList: DestructionListData;
};

export function DestructionListItems({ zaken }: DestructionListItemsProps) {
  const { state } = useNavigation();
  const { uuid, zaken: allZaken } =
    useLoaderData() as DestructionListDetailContext;
  const submit = useSubmit();
  const [isEditing, setIsEditing] = useState(false);

  const storageKey = `destruction-list-detail-${uuid}`;
  const dataGridProps = useDataGridProps(
    storageKey,
    isEditing
      ? allZaken
      : {
          count: zaken.length,
          next: null,
          previous: null,
          results: zaken,
        },
    isEditing ? zaken : [],
  );

  useAsync(async () => {
    await addToZaakSelection(storageKey, zaken);
  }, []);

  const onUpdate = async () => {
    const zaakSelection = await getZaakSelection(storageKey);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selected]) => selected)
      .map(([url]) => url);

    const formData = new FormData();
    zaakUrls.forEach((url) => formData.append("zaakUrls", url));

    submit(formData, { method: "PATCH" });

    setIsEditing(false);
  };

  return (
    <div className="zaken-list">
      <DataGrid
        {...dataGridProps.props}
        boolProps={{ explicit: true }}
        loading={state === "loading"}
        filterable={isEditing}
        showPaginator={isEditing}
        selectable={isEditing}
        selectionActions={
          isEditing
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
        title="Zaakdossiers"
      />
    </div>
  );
}
