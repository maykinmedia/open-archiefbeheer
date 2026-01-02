import {
  Body,
  Form,
  FormField,
  FormValidator,
  H2,
  P,
  Solid,
  useAlert,
  useDialog,
  validateForm,
} from "@maykin-ui/admin-ui";
import { invariant } from "@maykin-ui/client-common";
import { useCallback, useEffect, useState } from "react";
import { useActionData, useLoaderData } from "react-router-dom";

import { JsonValue, useSubmitAction } from "../../../../hooks";
import { useDataFetcher } from "../../../../hooks/useDataFetcher";
import { ArchiveConfiguration } from "../../../../lib/api/config";
import {
  clearBackendCache,
  listDestructionReportInformatieObjectTypeChoices,
  listDestructionReportResultaatTypeChoices,
  listDestructionReportStatusTypeChoices,
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
  const submit = useSubmitAction<UpdateSettingsAction>(false);
  const { archiveConfiguration, zaaktypeChoices } =
    useLoaderData() as DestructionReportSettingsPageContext;
  const alert = useAlert();
  const dialog = useDialog();
  const [formErrors, setFormErrors] = useState<
    Record<string, string> | undefined
  >();

  const errors = useActionData() as Record<string, string> | null;
  useEffect(() => {
    setFormErrors(errors || undefined);

    if (errors === null) {
      alert(
        "Instellingen opgeslagen",
        "De instellingen zijn succesvol opgeslagen",
        "Ok",
      );
    }
  }, [errors]);

  const [isValidState, setIsValidState] = useState(false);
  const [valuesState, setValuesState] = useState<Record<string, string>>(
    archiveConfiguration as Omit<ArchiveConfiguration, "zaaktypesShortProcess">,
  );

  const { data: statusTypeChoices } = useDataFetcher(
    (signal) => {
      if (!valuesState?.zaaktype) return [];
      return listDestructionReportStatusTypeChoices(
        valuesState?.zaaktype,
        signal,
      );
    },
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de statustypen!",
      initialState: [],
    },
    [valuesState?.zaaktype],
  );

  const { data: resultaatTypeChoices } = useDataFetcher(
    (signal) => {
      if (!valuesState?.zaaktype) return [];
      return listDestructionReportResultaatTypeChoices(
        valuesState?.zaaktype,
        signal,
      );
    },
    {
      initialState: [],
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de resultaattypen!",
    },
    [valuesState.zaaktype],
  );
  const { data: informatieObjectTypeChoices } = useDataFetcher(
    (signal) => {
      if (!valuesState?.zaaktype) return [];
      return listDestructionReportInformatieObjectTypeChoices(
        valuesState.zaaktype,
        signal,
      );
    },
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
      disabled: valuesState.zaaktype == "",
    },
    {
      label: "Statustype",
      name: "statustype",
      required: false,
      options: statusTypeChoices,
      value: valuesState.statustype,
      disabled: valuesState.zaaktype == "",
    },
    {
      label: "Resultaattype",
      name: "resultaattype",
      required: true,
      options: resultaatTypeChoices,
      value: valuesState.resultaattype,
      disabled: valuesState.zaaktype == "",
    },
  ];

  const handleValidate = useCallback<FormValidator>(
    (values, fields, validators) => {
      const errors = validateForm(values, fields, validators);
      const isValid = Object.keys(errors).length === 0;
      const newValues = Object.assign({ ...valuesState }, values);

      setIsValidState(isValid);

      invariant("zaaktype" in values, "No zaaktype found in the form values!");
      if (values.zaaktype == valuesState.zaaktype) {
        setValuesState(newValues);
      } else {
        // The zaaktype has changed, we need to reset the related resources.
        setValuesState({
          ...newValues,
          resultaattype: "",
          statustype: "",
          informatieobjecttype: "",
        });
      }
      return errors;
    },
    [valuesState],
  );

  const handleSave = useCallback(() => {
    submit({
      type: "PATCH-ARCHIVE-CONFIG",
      payload: valuesState as JsonValue,
    });
  }, [valuesState]);

  const handleClearChoicesCache = useCallback(async () => {
    dialog(
      "De caches worden ververst...",
      "Een moment geduld alstublieft",
      undefined,
      { allowClose: false },
    );
    try {
      await clearBackendCache();
    } catch (exc) {
      alert("Het verversen is NIET gelukt!", (exc as Error).message, "Ok");
      return;
    }
    sessionStorage.clear();
    alert(
      "Het verversen van de cache is gelukt!",
      "De informatieobjecttypen, statustypen en resultaattypen zijn succesvol ververst.",
      "Ok",
      () => window.location.reload(),
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
          errors={formErrors}
          fields={fields}
          validateOnChange
          showActions={false}
          validate={handleValidate}
        />
      </Body>
    </BaseSettingsView>
  );
}
