import {
  Body,
  Form,
  FormField,
  H2,
  P,
  SerializedFormData,
  Solid,
  useAlert,
  useDialog,
  validateForm,
} from "@maykin-ui/admin-ui";
import { useCallback, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { JsonValue, useSubmitAction } from "../../../../hooks";
import { useDataFetcher } from "../../../../hooks/useDataFetcher";
import { ArchiveConfiguration } from "../../../../lib/api/config";
import {
  clearChoicesCache,
  listInformatieObjectTypeChoices,
  listResultaatTypeChoices,
  listStatusTypeChoices,
} from "../../../../lib/api/private";
import { UpdateSettingsAction } from "../../Settings.action";
import { BaseSettingsView } from "../../abstract/BaseSettingsView";
import { DestructionReportSettingsPageContext } from "./DestructionReportSettingsPage.loader";

interface DestructionReportSetting {
  zaaktype: string;
  value: string | number;
  verkorteProcedure: boolean;
}

/**
 * Allows for configuring zaaktype eligible for the short procedure.
 */
export function DestructionReportSettingsPage() {
  const submit = useSubmitAction<UpdateSettingsAction>();
  const { archiveConfiguration, zaaktypeChoices } =
    useLoaderData() as DestructionReportSettingsPageContext;
  const alert = useAlert();
  const dialog = useDialog();

  const [isValidState, setIsValidState] = useState(false);
  const [valuesState, setValuesState] = useState<Record<string, string>>(
    archiveConfiguration as Omit<ArchiveConfiguration, "zaaktypesShortProcess">,
  );

  const { data: statusTypeChoices } = useDataFetcher(
    (signal) => listStatusTypeChoices(valuesState?.zaaktype, signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de statustypen!",
      initialState: [],
    },
    [valuesState?.zaaktype],
  );

  const { data: resultaatTypeChoices } = useDataFetcher(
    (signal) =>
      listResultaatTypeChoices(
        { zaaktypeIdentificatie: valuesState?.zaaktype },
        true,
        signal,
      ),
    {
      initialState: [],
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de resultaattypen!",
    },
    [valuesState.zaaktype],
  );
  const { data: informatieObjectTypeChoices } = useDataFetcher(
    (signal) => listInformatieObjectTypeChoices(valuesState.zaaktype, signal),
    {
      initialState: [],
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de informatie objecttypen!",
    },
    [valuesState.zaaktype],
  );

  const fields: FormField[] = [
    {
      label: "Bronorganisatie",
      name: "bronorganisatie",
      value: valuesState.bronorganisatie,
      required: true,
      maxLength: 9,
    },
    {
      label: "Zaaktype",
      name: "zaaktype",
      required: true,
      options: zaaktypeChoices,
      value: valuesState.zaaktype,
    },
    {
      label: "Informatieobjecttype",
      name: "informatieobjecttype",
      required: true,
      options: informatieObjectTypeChoices,
      value: valuesState.informatieobjecttype,
    },
    {
      label: "Statustype",
      name: "statustype",
      required: false,
      options: statusTypeChoices,
      value: valuesState.statustype,
    },
    {
      label: "Resultaattype",
      name: "resultaattype",
      required: true,
      options: resultaatTypeChoices,
      value: valuesState.resultaattype,
    },
  ];

  const handleValidate = useCallback(
    (values: SerializedFormData, fields: FormField[]) => {
      const errors = validateForm(values, fields);
      const isValid = Object.keys(errors).length === 0;
      const newValues = Object.assign({ ...valuesState }, values) as Omit<
        ArchiveConfiguration,
        "zaaktypesShortProcess"
      >;

      setIsValidState(isValid);
      setValuesState(newValues);
      return errors;
    },
    [valuesState],
  );

  const handleSave = useCallback(() => {
    submit({
      type: "PATCH-ARCHIVE-CONFIG",
      payload: valuesState as JsonValue,
    });
    alert(
      "Instellingen opgeslagen",
      "De instellingen zijn succesvol opgeslagen",
      "Ok",
    );
  }, [valuesState]);

  const handleClearChoicesCache = useCallback(async () => {
    dialog(
      "De caches worden ververst...",
      "Een moment geduld alstublieft",
      undefined,
      { allowClose: false },
    );
    await clearChoicesCache();
    alert(
      "Instellingen opgeslagen",
      "De instellingen zijn succesvol opgeslagen",
      "Ok",
    );
  }, []);

  return (
    <BaseSettingsView<DestructionReportSetting>
      secondaryNavigationItems={[
        {
          children: (
            <>
              <Solid.CheckCircleIcon />
              Verversen
            </>
          ),
          variant: "secondary",
          pad: "h",
          onClick: handleClearChoicesCache,
        },
        {
          children: (
            <>
              <Solid.DocumentArrowUpIcon />
              Opslaan
            </>
          ),
          disabled: !isValidState,
          pad: "h",
          variant: "primary",
          onClick: handleSave,
        },
      ]}
    >
      <Body>
        <H2>Vernietigingsrapport</H2>
        <P>
          Stel het zaaktype, informatieobjecttype, statustype en resultaattype
          in die worden gebruikt voor het aanmaken van de zaak met de verklaring
          van vernietiging.
        </P>
        <P>
          Na het vernietigen van een vernietigingslijst wordt automatisch een
          zaak aangemaakt met de verklaring van vernietiging. De geselecteerde
          typen worden hierbij gebruikt.
        </P>

        <Form
          aria-label="Vernietigingsrapport instellingen"
          fields={fields}
          validateOnChange
          showActions={false}
          validate={handleValidate}
        />
      </Body>
    </BaseSettingsView>
  );
}
