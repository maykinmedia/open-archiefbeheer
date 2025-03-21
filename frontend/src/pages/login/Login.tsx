import {
  LoginTemplate,
  LoginTemplateProps,
  forceArray,
} from "@maykin-ui/admin-ui";
import { useContext } from "react";
import { useActionData, useSubmit } from "react-router-dom";

import { OidcConfigContext } from "../../contexts";
import "./Login.css";

export type LoginProps = React.ComponentProps<"main"> & {
  // Props here.
};

/*
 * Add the redirect URL to the callback URL
 */
const makeRedirectUrl = (oidcLoginUrl: string) => {
  const currentUrl = new URL(window.location.href);
  const redirectUrl = new URL("/", currentUrl);
  const loginUrl = new URL(oidcLoginUrl);
  loginUrl.searchParams.set("next", redirectUrl.href);

  return loginUrl.href;
};

type LoginFormType = { username: string; password: string };

/**
 * Login page
 */
export function LoginPage({ ...props }: LoginProps) {
  const { enabled: oidcEnabled, loginUrl: oidcLoginUrl } =
    useContext(OidcConfigContext);

  const fields = [
    {
      autoFocus: true,
      autoComplete: "username",
      label: "Gebruikersnaam",
      name: "username",
      type: "text",
    },
    {
      autoComplete: "current-password",
      label: "Wachtwoord",
      name: "password",
      type: "password",
    },
  ];

  const actionData = useActionData() || {};
  const submit = useSubmit();

  const formErrors = Object.fromEntries(
    Object.entries(actionData).map(([key, values]) => [
      key,
      forceArray(values)?.join(", "),
    ]),
  );
  const { detail, nonFieldErrors, ...errors } = formErrors;

  const oidcProps: Partial<LoginTemplateProps<LoginFormType>> = {};
  if (oidcEnabled) {
    oidcProps.urlOidcLogin = makeRedirectUrl(oidcLoginUrl);
    oidcProps.labelOidcLogin = "Organisatie login";
  }

  return (
    <LoginTemplate<LoginFormType>
      slotPrimaryNavigation={<></>} // FIXME: Should be easier to override
      formProps={{
        "aria-label": "Vul uw inloggegevens in",
        nonFieldErrors: nonFieldErrors || detail,
        errors,
        fields,
        onSubmit: (_, data) => submit(data, { method: "POST" }),
      }}
      {...oidcProps}
      {...props}
    />
  );
}
