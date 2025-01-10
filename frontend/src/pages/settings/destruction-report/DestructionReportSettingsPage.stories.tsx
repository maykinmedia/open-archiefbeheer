import type { Meta, StoryObj } from "@storybook/react";

import { DestructionReportSettingsPage } from "./DestructionReportSettingsPage";

const meta: Meta<typeof DestructionReportSettingsPage> = {
  title: "Pages/Settings",
  component: DestructionReportSettingsPage,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsPageStory: Story = {};
