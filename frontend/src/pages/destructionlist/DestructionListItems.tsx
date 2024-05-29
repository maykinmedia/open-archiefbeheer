import { AttributeData, DataGrid, Outline } from "@maykin-ui/admin-ui";
import React, { useState } from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

import { Zaak } from "../../types";
import "./DestructionListDetail.css";
import { DestructionListDetailContext } from "./types";
import { getFields } from "./utils";

export type DestructionListItemsProps = {
  zaken: Zaak[];
};

export function DestructionListItems({ zaken }: DestructionListItemsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { zaken: allZaken, zaaktypeChoices } =
    useLoaderData() as DestructionListDetailContext;
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useNavigation();

  const fields = getFields(searchParams, zaaktypeChoices);

  const onUpdate: React.MouseEventHandler = () => {
    console.log("TODO");
  };

  const onFilter = (filterData: AttributeData) => {
    const combinedParams = {
      ...Object.fromEntries(searchParams),
      ...filterData,
    } as AttributeData<string>;

    const activeParams = Object.fromEntries(
      Object.entries(combinedParams).filter(
        (keyValuePair) => !!keyValuePair[1],
      ),
    );

    setSearchParams(activeParams);
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
          onFilter={onFilter}
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
