import {
  Body,
  Form,
  FormField,
  H2,
  P,
  SerializedFormData,
  Solid,
  useAlert,
  validateForm,
} from "@maykin-ui/admin-ui";
import { useCallback, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { JsonValue, useSubmitAction } from "../../../../hooks";
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
  const {
    archiveConfiguration,
    informatieObjectTypeChoices,
    resultaatTypeChoices,
    selectieLijstKlasseChoices,
    statusTypeChoices,
    zaaktypeChoices,
  } = useLoaderData() as DestructionReportSettingsPageContext;
  const [valuesState, setValuesState] = useState<SerializedFormData | null>(
    archiveConfiguration,
  );
  const alert = useAlert();

  const fields: FormField[] = [
    {
      label: "Bronorganisatie",
      name: "bronorganisatie",
      value: archiveConfiguration.bronorganisatie,
      required: true,
      maxLength: 9,
    },
    {
      label: "Zaaktype",
      name: "zaaktype",
      required: true,
      options: zaaktypeChoices,
      value: archiveConfiguration.zaaktype,
    },
    {
      label: "Statustype",
      name: "statustype",
      required: true,
      options: statusTypeChoices,
      value: archiveConfiguration.statustype,
    },
    {
      label: "Resultaattype",
      name: "resultaattype",
      required: true,
      options: resultaatTypeChoices,
      value: archiveConfiguration.resultaattype,
    },
    {
      label: "Informatieobjecttype",
      name: "informatieobjecttype",
      required: true,
      options: informatieObjectTypeChoices,
      value: archiveConfiguration.informatieobjecttype,
    },
    {
      label: "Selectielijstklasse",
      name: "selectielijstklasse",
      required: true,
      options: selectieLijstKlasseChoices,
      value: archiveConfiguration.selectielijstklasse,
    },
  ];

  const handleValidate = useCallback(
    (values: SerializedFormData, fields: FormField[]) => {
      const errors = validateForm(values, fields);
      const isValid = Object.keys(errors).length === 0;
      if (!isValid) {
        setValuesState(null);
      } else {
        setValuesState(values);
      }
      return errors;
    },
    [],
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

  return (
    <BaseSettingsView<DestructionReportSetting>
      secondaryNavigationItems={[
        {
          children: (
            <>
              <Solid.DocumentArrowUpIcon />
              Opslaan
            </>
          ),
          disabled: !valuesState,
          pad: "h",
          variant: "primary",
          onClick: handleSave,
        },
      ]}
    >
      <Body>
        <H2>Vernietigingsrapport</H2>
        <P>
          Configureer de eigenschappen voor de aangemaakte zaak van
          vernietigingsrapport.
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
