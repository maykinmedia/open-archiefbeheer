import "@maykin-ui/admin-ui/style";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../.storybook/decorators";
import ExtraConfigContext from "../../lib/contexts/ExtraConfigContext";
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

export const LoginPageWithOIDC: Story = {
  render: (args) => (
    <ExtraConfigContext.Provider
      value={{
        oidc: {
          enabled: true,
          loginUrl: "http://backend.nl/oidc/authenticate",
        },
      }}
    >
      <LoginPage />
    </ExtraConfigContext.Provider>
  ),
  play: async (context) => {
    const canvas = within(context.canvasElement);

    const oidcButton: HTMLBaseElement = await canvas.findByRole("link", {
      name: "Organisatie login",
    });

    const redirectUrl = new URL(oidcButton.href);
    const nextUrl = redirectUrl.searchParams.get("next");

    expect(nextUrl).not.toBeNull();
    expect(new URL(nextUrl as string).pathname).toEqual("/");
  },
};
