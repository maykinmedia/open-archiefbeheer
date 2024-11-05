import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../.storybook/decorators";
import { assertCheckboxSelection } from "../../../.storybook/playFunctions";
import { SettingsPage } from "./Settings";

const meta: Meta<typeof SettingsPage> = {
  title: "Pages/Settings",
  component: SettingsPage,
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

export const SettingsPageStory: Story = {
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
