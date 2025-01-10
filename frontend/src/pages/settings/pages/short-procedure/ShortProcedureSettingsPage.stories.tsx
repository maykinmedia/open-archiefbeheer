import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../../../.storybook/decorators";
import { assertCheckboxSelection } from "../../../../../.storybook/playFunctions";
import { ShortProcedureSettingsPage } from "./ShortProcedureSettingsPage";

const meta: Meta<typeof ShortProcedureSettingsPage> = {
  title: "Pages/Settings",
  component: ShortProcedureSettingsPage,
  decorators: [ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE = {
  zaaktypesShortProcess: [],
  zaaktypeChoices: Array.from({ length: 15 }, (_, i) => ({
    label: `Zaaktype ${i}`,
    value: i.toString(),
  })),
};

export const UpdateShortProcedureSettings: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE,
      },
    },
  },
  play: async (context) => {
    await assertCheckboxSelection(context);
  },
};
