import {
  AttributeData,
  DataGrid,
  Outline,
  TypedField,
} from "@maykin-ui/admin-ui";
import React, { useState } from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

import { Zaak } from "../../types";
import "./DestructionListDetail.css";
import { DestructionListDetailContext } from "./types";

export type DestructionListItemsProps = {
  zaken: Zaak[];
};

export function DestructionListItems({ zaken }: DestructionListItemsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { zaken: allZaken } = useLoaderData() as DestructionListDetailContext;
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useNavigation();

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

  const onUpdate: React.MouseEventHandler = () => {
    console.log("TODO");
  };

  return (
    <div className="zaken-list">
      {isEditing ? (
        <DataGrid
          title="Zaakdossiers"
          count={allZaken.count}
          objectList={allZaken.results as unknown as AttributeData[]}
          fields={fields}
          filterable={true}
          selected={zaken as unknown as AttributeData[]}
          boolProps={{ explicit: true }}
          selectable={true}
          selectionActions={[
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
          ]}
          customComparisonFunction={(item1, item2) => item1.uuid === item2.uuid}
          paginatorProps={{
            count: allZaken.count,
            pageSize: 100,
            page: Number(searchParams.get("page")) || 1,
            loading: state === "loading",
            labelLoading: "Loading...",
            onPageChange: (page) =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: String(page),
              }),
          }}
          loading={state === "loading"}
        />
      ) : (
        <DataGrid
          title="Zaakdossiers"
          count={zaken.length}
          objectList={zaken as unknown as AttributeData[]}
          fields={fields}
          boolProps={{ explicit: true }}
          selectionActions={[
            {
              children: <Outline.PencilIcon />,
              onClick: () => setIsEditing(true),
              wrap: false,
            },
          ]}
        />
      )}
    </div>
  );
}