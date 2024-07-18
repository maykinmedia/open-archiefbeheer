import {
  BaseTemplate,
  Body,
  Column,
  Form,
  FormField,
  Grid,
  H1,
  Modal,
  P,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { FormEvent, Fragment, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { useSubmitAction } from "../../hooks";
import "./Settings.css";
import { SettingsSection, SettingsSectionProps } from "./components";
import { UpdateSettingsAction } from "./settings.action";
import { SettingsContext } from "./settings.loader";

export type SettingsPageProps = React.ComponentProps<"main"> & {
  // Props here.
};

/**
 * Settings page
 */
export function SettingsPage({ children, ...props }: SettingsPageProps) {
  const { zaaktypesShortProcess, zaaktypeChoices } =
    useLoaderData() as SettingsContext;
  const submitAction = useSubmitAction<UpdateSettingsAction>();

  const [modalOpenState, setModalOpenState] = useState<boolean>(false);

  const verkorteProcedureFormFields: FormField[] = [
    {
      autoComplete: "off",
      label: "Verkorte zaaktypes",
      name: "verkorte_zaaktypes",
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
    const verkorteZaaktypes = (data.verkorte_zaaktypes ?? []) as string[];
    submitAction({
      type: "PATCH-ARCHIVE-CONFIG",
      payload: {
        zaaktypesShortProcess: verkorteZaaktypes,
      },
    });
    setModalOpenState(true);
  };

  const settingsArray: SettingsSectionProps[] = [
    {
      settingTitle: "Verkorte procedure",
      settingDescription:
        "Pas hier de zaaktypes aan die in aanmerking komen voor de verkorte procedure.",
      children: (
        <Form
          fields={verkorteProcedureFormFields}
          validateOnChange={true}
          onSubmit={handleSubmitPatchArchiveConfig}
        />
      ),
    },
  ];

  return (
    <BaseTemplate>
      <Modal
        title={"Instellingen opgeslagen"}
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <P>De instellingen zijn succesvol opgeslagen.</P>
        </Body>
      </Modal>
      <Body>
        <Grid>
          <Column span={12}>
            <H1>Instellingen</H1>
            <P>
              Hier kun je instellingen aanpassen die van invloed zijn op de
              applicatie.
            </P>
            <br />
            <br />
          </Column>
        </Grid>
        <Grid cols={4}>
          {settingsArray.map((setting, index) => (
            <Fragment key={index}>
              <SettingsSection {...setting} />
              {/* TODO: Can add a Separator here once we have more setting entries. Currently we don't have a Separator component. For example: */}
              {/* {index < settingsArray.length - 1 && <Separator />} */}
            </Fragment>
          ))}
        </Grid>
      </Body>
    </BaseTemplate>
  );
}
