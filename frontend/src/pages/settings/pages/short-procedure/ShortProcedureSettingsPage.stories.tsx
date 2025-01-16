import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../../../.storybook/decorators";
import { MOCKS } from "../../../../../.storybook/mockData";
import { assertCheckboxSelection } from "../../../../../.storybook/playFunctions";
import {
  recordManagerFactory,
  zaaktypeChoicesFactory,
} from "../../../../fixtures";
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
  decorators: [ReactRouterDecorator],
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
      },
    },
  },
  play: async (context) => {
    await assertCheckboxSelection(context);
  },
};
