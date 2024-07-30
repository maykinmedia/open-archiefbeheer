import {
  Body,
  BodyBaseTemplate,
  Button,
  Form,
  FormField,
  H2,
  Modal,
  P,
  SerializedFormData,
  Toolbar,
} from "@maykin-ui/admin-ui";
import { FormEvent, useEffect, useState } from "react";
import { useActionData, useLoaderData } from "react-router-dom";

import { useSubmitAction } from "../../hooks";
import "./Settings.css";
import { UpdateSettingsAction } from "./settings.action";
import { SettingsContext } from "./settings.loader";

/**
 * Settings page
 */
export function SettingsPage() {
  const { zaaktypesShortProcess, zaaktypeChoices } =
    useLoaderData() as SettingsContext;
  const submitAction = useSubmitAction<UpdateSettingsAction>();
  const errors = (useActionData() || undefined) as
    | Record<string, string>
    | undefined;

  // Close modal on error.
  useEffect(() => {
    errors && setModalOpenState(false);
  }, [errors]);

  const [modalOpenState, setModalOpenState] = useState<boolean>(false);

  const verkorteProcedureFormFields: FormField[] = [
    {
      autoComplete: "off",
      label: "Verkorte zaaktypes",
      name: "zaaktypesShortProcess",
      type: "checkbox",
      options: zaaktypeChoices.map((choice) => ({
        value: choice.value,
        label: choice.label,
        defaultChecked: zaaktypesShortProcess.includes(String(choice.value)),
      })),
    },
  ];

  const handleSubmitPatchArchiveConfig = async (
    _: FormEvent,
    data: SerializedFormData,
  ) => {
    const zaaktypesShortProcess = (data.zaaktypesShortProcess ??
      []) as string[];
    submitAction({
      type: "PATCH-ARCHIVE-CONFIG",
      payload: {
        zaaktypesShortProcess: zaaktypesShortProcess,
      },
    });
    setModalOpenState(true);
  };

  return (
    <BodyBaseTemplate>
      <Modal
        title={"Instellingen opgeslagen"}
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <P>De instellingen zijn succesvol opgeslagen.</P>
          <Toolbar align="end">
            <Button onClick={() => setModalOpenState(false)}>Sluiten</Button>
          </Toolbar>
        </Body>
      </Modal>
      <H2>Instellingen</H2>
      <P>
        Hier kun je instellingen aanpassen die van invloed zijn op de
        applicatie.
      </P>
      <br />
      <Form
        errors={errors}
        fields={verkorteProcedureFormFields}
        validateOnChange={true}
        onSubmit={handleSubmitPatchArchiveConfig}
      />
    </BodyBaseTemplate>
  );
}
