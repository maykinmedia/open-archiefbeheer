import { Body, H2, ListTemplate, Solid, useAlert } from "@maykin-ui/admin-ui";
import { useCallback, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { useSubmitAction } from "../../hooks";
import "./Settings.css";
import { UpdateSettingsAction } from "./settings.action";
import { SettingsContext } from "./settings.loader";

interface ShortProcedureSetting {
  zaaktype: string;
  value: string | number;
  verkorteProcedure: boolean;
}

/**
 * Settings page
 */
export function SettingsPage() {
  const { zaaktypesShortProcess, zaaktypeChoices } =
    useLoaderData() as SettingsContext;
  const submitAction = useSubmitAction<UpdateSettingsAction>();
  const alert = useAlert();

  const objectList = useMemo<ShortProcedureSetting[]>(
    () =>
      zaaktypeChoices.map((zaaktype) => ({
        zaaktype: zaaktype.label.toString(),
        value: zaaktype.value || "",
        verkorteProcedure: zaaktypesShortProcess.includes(
          String(zaaktype.value),
        ),
      })),
    [zaaktypeChoices, zaaktypesShortProcess],
  );

  const [selectedZaaktypes, setSelectedZaaktypes] = useState<Set<string>>(
    new Set(
      objectList
        .filter((item) => item.verkorteProcedure)
        .map((item) => String(item.zaaktype)),
    ),
  );

  const handleSave = useCallback(() => {
    const updatedZaaktypes = objectList
      .filter((item) => selectedZaaktypes.has(String(item.zaaktype)))
      .map((item) => String(item.value));

    const countAdded = updatedZaaktypes.filter(
      (zaaktype) => !zaaktypesShortProcess.includes(zaaktype),
    ).length;

    const countRemoved = zaaktypesShortProcess.filter(
      (zaaktype) => !updatedZaaktypes.includes(zaaktype),
    ).length;

    const changesMessage = [
      countAdded > 0
        ? `${countAdded} zaaktype${countAdded === 1 ? "" : "n"} toegevoegd`
        : "",
      countRemoved > 0
        ? `${countRemoved} zaaktype${countRemoved === 1 ? "" : "n"} verwijderd`
        : "",
    ]
      .filter(Boolean)
      .join(" en ");

    const message = `De instellingen zijn succesvol opgeslagen${
      changesMessage ? `, ${changesMessage} van de verkorte procedure.` : ""
    }`;

    submitAction({
      type: "PATCH-ARCHIVE-CONFIG",
      payload: { zaaktypesShortProcess: updatedZaaktypes },
    });

    alert("Instellingen opgeslagen", message, "Ok");
  }, [
    selectedZaaktypes,
    objectList,
    zaaktypesShortProcess,
    submitAction,
    alert,
  ]);

  const onSelectionChange = useCallback(
    (selectedRows: ShortProcedureSetting[]) => {
      const newSelected = new Set(selectedRows.map((row) => row.zaaktype));
      setSelectedZaaktypes(newSelected);
    },
    [],
  );

  const selectedItems = useMemo(
    () =>
      objectList.filter((item) => selectedZaaktypes.has(String(item.zaaktype))),
    [objectList, selectedZaaktypes],
  );

  return (
    <ListTemplate<ShortProcedureSetting>
      secondaryNavigationItems={[
        {
          children: (
            <>
              <Solid.DocumentArrowUpIcon />
              Opslaan
            </>
          ),
          pad: "h",
          onClick: handleSave,
        },
      ]}
      dataGridProps={{
        boolProps: { explicit: true },
        objectList,
        fields: [{ name: "zaaktype", type: "string" }],
        selectable: true,
        allowSelectAll: false,
        selected: selectedItems,
        count: zaaktypeChoices.length,
        decorate: true,
        filterable: true,
        sort: "zaaktype",
        onSelectionChange,
      }}
    >
      <Body>
        <H2>Instellingen</H2>
      </Body>
    </ListTemplate>
  );
}
