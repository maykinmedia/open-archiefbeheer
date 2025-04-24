import type { Meta, StoryObj } from "@storybook/react";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../../.storybook/decorators";
import { MOCKS } from "../../../../../.storybook/mockData";
import {
  assertCheckboxSelection,
  clickButton,
} from "../../../../../.storybook/playFunctions";
import {
  administratorFactory,
  zaaktypeChoicesFactory,
} from "../../../../fixtures";
import { settingsAction } from "../../Settings.action";
import { ShortProcedureSettingsPage } from "./ShortProcedureSettingsPage";
import {
  ShortProcedureSettingsPageContext,
  shortProcedureSettingsPageLoader,
} from "./ShortProcedureSettingsPage.loader";

const FIXTURE: ShortProcedureSettingsPageContext = {
  zaaktypeChoices: [],
  zaaktypesShortProcess: [],
};

const meta: Meta<typeof ShortProcedureSettingsPage> = {
  title: "Pages/Settings",
  component: ShortProcedureSettingsPage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    mockData: [
      MOCKS.OIDC_INFO,
      MOCKS.DESTRUCTION_SEARCH_ZAAKTYPE_CHOICES,
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
        url: "http://localhost:8000/api/v1/_zaaktypen-choices/?notInDestructionList=true",
        method: "GET",
        status: 200,
        response: zaaktypeChoicesFactory(),
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UpdateShortProcedureSettings: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: shortProcedureSettingsPageLoader,
        action: settingsAction,
      },
    },
    clickButton: {
      name: "Opslaan",
    },
  },
  play: async (context) => {
    await assertCheckboxSelection(context);
    await clickButton(context);
  },
};
