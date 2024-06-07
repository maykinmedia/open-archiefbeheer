import "@maykin-ui/admin-ui/style";
import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../.storybook/decorators";
import { LoginPage } from "./Login";

const meta: Meta<typeof LoginPage> = {
  title: "Pages/Login",
  component: LoginPage,
  decorators: [ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LoginPageStory: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};
