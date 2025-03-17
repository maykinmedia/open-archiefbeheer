import type { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../../.storybook/decorators";
import { MOCKS } from "../../../../../.storybook/mockData";
import { clickButton, fillForm } from "../../../../../.storybook/playFunctions";
import {
  FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES,
  FIXTURE_RESULTAATTYPE_CHOICES,
  FIXTURE_STATUSTYPE_CHOICES,
  FIXTURE_ZAAKTYPE_CHOICES,
  informatieObjectTypeChoicesFactory,
  recordManagerFactory,
  resultaatTypeChoicesFactory,
  statusTypeChoicesFactory,
  zaaktypeChoicesFactory,
} from "../../../../fixtures";
import { settingsAction } from "../../Settings.action";
import { DestructionReportSettingsPage } from "./DestructionReportSettingsPage";
import {
  DestructionReportSettingsPageContext,
  destructionReportSettingsPageLoader,
} from "./DestructionReportSettingsPage.loader";

const FIXTURE: DestructionReportSettingsPageContext = {
  archiveConfiguration: {
    bronorganisatie: "000000000",
    informatieobjecttype: FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES[0].value,
    resultaattype: FIXTURE_RESULTAATTYPE_CHOICES[0].value,
    statustype: FIXTURE_STATUSTYPE_CHOICES[0].value,
    zaaktype: FIXTURE_ZAAKTYPE_CHOICES[0].value as string,
    zaaktypesShortProcess: [],
  },
  zaaktypeChoices: zaaktypeChoicesFactory(),
};

const meta: Meta<typeof DestructionReportSettingsPage> = {
  title: "Pages/Settings",
  component: DestructionReportSettingsPage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    mockData: [
      MOCKS.OIDC_INFO,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/archive-config?",
        method: "GET",
        status: 200,
        response: FIXTURE,
      },
      {
        url: "http://localhost:8000/api/v1/archive-config?",
        method: "PATCH",
        status: 200,
        response: FIXTURE,
      },
      {
        url: "http://localhost:8000/api/v1/_external-zaaktypen-choices/?notInDestructionList=true",
        method: "GET",
        status: 200,
        response: zaaktypeChoicesFactory(),
      },
      {
        url: `http://localhost:8000/api/v1/_statustype-choices/?zaaktype=${FIXTURE.zaaktypeChoices[1].value}`,
        method: "GET",
        status: 200,
        response: statusTypeChoicesFactory(),
      },
      {
        url: `http://localhost:8000/api/v1/_external-resultaattype-choices/?zaaktype=${FIXTURE.zaaktypeChoices[1].value}`,
        method: "GET",
        status: 200,
        response: resultaatTypeChoicesFactory(),
      },
      {
        url: `http://localhost:8000/api/v1/_informatieobjecttype-choices/?zaaktype=${FIXTURE.zaaktypeChoices[1].value}`,
        method: "GET",
        status: 200,
        response: informatieObjectTypeChoicesFactory(),
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UpdateDestructionReportSettings: Story = {
  parameters: {
    fillForm: {
      formValues: {
        Bronorganisatie: "000000001",
        Zaaktype: FIXTURE_ZAAKTYPE_CHOICES[1].label,
        Statustype: FIXTURE_STATUSTYPE_CHOICES[1].label,
        Resultaattype: FIXTURE_RESULTAATTYPE_CHOICES[1].label,
        Informatieobjecttype: FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES[1].label,
      },
      submitForm: false,
    },
    clickButton: {
      name: "Opslaan",
    },
    reactRouterDecorator: {
      route: {
        loader: destructionReportSettingsPageLoader,
        action: settingsAction,
      },
    },
  },
  play: async (context) => {
    await fillForm(context);
    await clickButton(context);
    await within(context.canvasElement).findByText("Instellingen opgeslagen");
  },
};
