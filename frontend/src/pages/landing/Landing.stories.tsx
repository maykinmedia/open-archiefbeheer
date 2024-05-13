import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../.storybook/decorators";
import { LandingPage, landingLoader } from "./Landing";

const meta: Meta<typeof LandingPage> = {
  title: "Pages/Landing",
  component: LandingPage,
  decorators: [ReactRouterDecorator],
  parameters: {
    layout: "fullscreen",
    loader: landingLoader,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const landingPage: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};
