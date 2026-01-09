import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../../.storybook/decorators";
import { MOCKS } from "../../../../../.storybook/mockData";
import { clickButton, fillForm } from "../../../../../.storybook/playFunctions";
import {
  FIXTURE_DESTRUCTION_REPORT_ZAAKTYPE_CHOICES,
  FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES,
  FIXTURE_RESULTAATTYPE_CHOICES,
  FIXTURE_STATUSTYPE_CHOICES,
  administratorFactory,
  informatieObjectTypeChoicesFactory,
  resultaatTypeChoicesFactory,
  statusTypeChoicesFactory,
} from "../../../../fixtures";
import { settingsAction } from "../../Settings.action";
import { DestructionReportSettingsPage } from "./DestructionReportSettingsPage";
import {
  DestructionReportSettingsPageContext,
  destructionReportSettingsPageLoader,
} from "./DestructionReportSettingsPage.loader";

const FIXTURE: DestructionReportSettingsPageContext = {
  archiveConfiguration: {
    bronorganisatie: "123456782",
    informatieobjecttype: FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES[0].value,
    resultaattype: FIXTURE_RESULTAATTYPE_CHOICES[0].value,
    statustype: FIXTURE_STATUSTYPE_CHOICES[0].value,
    zaaktype: FIXTURE_DESTRUCTION_REPORT_ZAAKTYPE_CHOICES[0].value as string,
    zaaktypesShortProcess: [],
  },
  zaaktypeChoices: FIXTURE_DESTRUCTION_REPORT_ZAAKTYPE_CHOICES,
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
        response: administratorFactory(),
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
        url: "http://localhost:8000/api/v1/destructionreport-zaaktypen-choices/",
        method: "GET",
        status: 200,
        response: FIXTURE_DESTRUCTION_REPORT_ZAAKTYPE_CHOICES,
      },
      {
        url: `http://localhost:8000/api/v1/destructionreport-statustype-choices/?zaaktype=${FIXTURE.zaaktypeChoices[1].value}`,
        method: "GET",
        status: 200,
        response: statusTypeChoicesFactory(),
      },
      {
        url: `http://localhost:8000/api/v1/destructionreport-resultaattype-choices/?zaaktype=${FIXTURE.zaaktypeChoices[1].value}`,
        method: "GET",
        status: 200,
        response: resultaatTypeChoicesFactory(),
      },
      {
        url: `http://localhost:8000/api/v1/destructionreport-informatieobjecttype-choices/?zaaktype=${FIXTURE.zaaktypeChoices[1].value}`,
        method: "GET",
        status: 200,
        response: informatieObjectTypeChoicesFactory(),
      },
      {
        url: `http://localhost:8000/api/v1/health-check`,
        method: "GET",
        status: 200,
        response: {
          success: true,
          errors: [],
        },
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
        Bronorganisatie: "123456782",
        Zaaktype: FIXTURE_DESTRUCTION_REPORT_ZAAKTYPE_CHOICES[1].label,
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
