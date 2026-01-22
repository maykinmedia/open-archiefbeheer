import "@maykin-ui/admin-ui/style";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { MOCKS } from "../../../.storybook/mockData";
import { fillForm } from "../../../.storybook/playFunctions";
import { OidcConfigContext } from "../../contexts";
import { userFactory } from "../../fixtures/user";
import { LoginPage } from "./Login";
import { loginAction } from "./Login.action";

const meta: Meta<typeof LoginPage> = {
  title: "Pages/Login",
  component: LoginPage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        action: loginAction,
      },
    },
    mockData: [
      MOCKS.HEALTH_CHECK,
      MOCKS.WHOAMI,
      MOCKS.OIDC_INFO,
      {
        url: "http://localhost:8000/api/v1/auth/login/?",
        method: "POST",
        status: 200,
        response: userFactory(),
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LoginPageStory: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
  parameters: {
    fillForm: {
      formValues: {
        Gebruikersnaam: "Record Manager",
        Wachtwoord: "ANic3Password",
      },
    },
  },
  play: async (context) => {
    await fillForm(context);
  },
};

export const LoginPageWithOIDC: Story = {
  render: () => (
    <OidcConfigContext.Provider
      value={{
        enabled: true,
        loginUrl: "http://backend.nl/oidc/authenticate",
      }}
    >
      <LoginPage />
    </OidcConfigContext.Provider>
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
