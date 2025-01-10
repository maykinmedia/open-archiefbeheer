import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../../../.storybook/decorators";
import { fillForm } from "../../../../../.storybook/playFunctions";
import {
  FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES,
  FIXTURE_RESULTAATTYPE_CHOICES,
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  FIXTURE_STATUSTYPE_CHOICES,
  FIXTURE_ZAAKTYPE_CHOICES,
  informatieObjectTypeChoicesFactory,
  resultaatTypeChoicesFactory,
  selectieLijstKlasseFactory,
  statusTypeChoicesFactory,
  zaaktypeChoicesFactory,
} from "../../../../fixtures";
import { DestructionReportSettingsPage } from "./DestructionReportSettingsPage";
import { DestructionReportSettingsPageContext } from "./DestructionReportSettingsPage.loader";

const meta: Meta<typeof DestructionReportSettingsPage> = {
  title: "Pages/Settings",
  component: DestructionReportSettingsPage,
  decorators: [ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE: DestructionReportSettingsPageContext = {
  archiveConfiguration: {
    bronorganisatie: "000000000",
    informatieobjecttype: FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES[0].value,
    resultaattype: FIXTURE_RESULTAATTYPE_CHOICES[0].value,
    selectielijstklasse: FIXTURE_SELECTIELIJSTKLASSE_CHOICES[0].value,
    statustype: FIXTURE_STATUSTYPE_CHOICES[0].value,
    zaaktype: FIXTURE_ZAAKTYPE_CHOICES[0].value as string,
    zaaktypesShortProcess: [],
  },
  informatieObjectTypeChoices: informatieObjectTypeChoicesFactory(),
  resultaatTypeChoices: resultaatTypeChoicesFactory(),
  selectieLijstKlasseChoices: selectieLijstKlasseFactory(),
  statusTypeChoices: statusTypeChoicesFactory(),
  zaaktypeChoices: zaaktypeChoicesFactory(),
};

export const UpdateDestructionReportSettings: Story = {
  parameters: {
    fillForm: {
      formValues: {
        Bronorganisatie: "000000001",
        Zaaktype: FIXTURE_ZAAKTYPE_CHOICES[1].label,
        Statustype: FIXTURE_STATUSTYPE_CHOICES[1].label,
        Resultaattype: FIXTURE_RESULTAATTYPE_CHOICES[1].label,
        Informatieobjecttype: FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES[1].label,
        Selectielijstklasse: FIXTURE_SELECTIELIJSTKLASSE_CHOICES[1].label,
      },
      submitForm: false,
    },
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE,
      },
    },
  },
  play: async (context) => {
    await fillForm(context);
  },
};
