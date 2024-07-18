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

export const settingsPage: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};
