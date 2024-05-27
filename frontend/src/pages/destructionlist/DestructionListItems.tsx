import {
  AttributeData,
  Button,
  DataGrid,
  H2,
  Outline,
  TypedField,
} from "@maykin-ui/admin-ui";
import React, { useState } from "react";

import { Zaak } from "../../types";
import "./DestructionListDetail.css";

export type DestructionListItemsProps = {
  zaken: Zaak[];
};

export function DestructionListItems({ zaken }: DestructionListItemsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const objectList = zaken as unknown as AttributeData[];
  const fields: TypedField[] = [
    {
      name: "identificatie",
      type: "string",
    },
    {
      name: "zaaktype",
      type: "string",
    },
    {
      name: "omschrijving",
      type: "string",
    },
    {
      name: "looptijd",
      valueTransform: (rowData) => {
        const zaak = rowData as unknown as Zaak;
        const startDate = new Date(zaak.startdatum);
        const endDate = zaak.einddatum ? new Date(zaak.einddatum) : new Date();
        return (
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + " dagen"
        );
      },
      type: "string",
    },
    {
      name: "resultaattype",
      type: "string",
    },
    {
      name: "bewaartermijn",
      type: "string",
    },
    {
      name: "vcs",
      type: "string",
    },
    {
      name: "relaties",
      valueTransform: (rowData) =>
        Boolean((rowData as unknown as Zaak)?.relevanteAndereZaken?.length),
      type: "boolean",
      options: [
        { value: "true", label: "Ja" },
        { value: "false", label: "Nee" },
      ],
    },
  ];

  return (
    <div className="zaken-list">
      <div className="zaken-list zaken-list__header">
        <H2>Zaakdossiers</H2>
        {isEditing ? (
          <div className="zaken-list zaken-list__action-buttons">
            <Button
              variant="primary"
              onClick={() => {
                console.log("TODO");
              }}
            >
              Verzenden
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Annuleren
            </Button>
          </div>
        ) : (
          <Button
            variant="transparent"
            onClick={() => {
              setIsEditing(true);
            }}
          >
            <Outline.PencilIcon />
          </Button>
        )}
      </div>
      {isEditing ? (
        "TODO"
      ) : (
        <DataGrid
          count={zaken.length}
          objectList={objectList}
          fields={fields}
          boolProps={{ explicit: true }}
        />
      )}
    </div>
  );
}
