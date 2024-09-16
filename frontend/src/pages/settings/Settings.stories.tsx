import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../.storybook/decorators";
import { SettingsPage } from "./Settings";

const meta: Meta<typeof SettingsPage> = {
  title: "Pages/Settings",
  component: SettingsPage,
  decorators: [ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE = {
  zaaktypesShortProcess: ["1", "2", "3"],
  zaaktypeChoices: [
    { value: 1, label: "Zaaktype 1" },
    { value: 2, label: "Zaaktype 2" },
    { value: 3, label: "Zaaktype 3" },
  ],
};

export const SettingsPageStory: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE,
      },
    },
  },
};
