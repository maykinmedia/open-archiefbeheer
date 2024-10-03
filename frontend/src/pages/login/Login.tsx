import {
  AttributeData,
  LoginTemplate,
  LoginTemplateProps,
  forceArray,
} from "@maykin-ui/admin-ui";
import { useContext } from "react";
import { useActionData, useSubmit } from "react-router-dom";

import ExtraConfigContext from "../../lib/contexts/ExtraConfigContext";
import "./Login.css";

export type LoginProps = React.ComponentProps<"main"> & {
  // Props here.
};

/**
 * Login page
 */
export function LoginPage({ ...props }: LoginProps) {
  const { oidc } = useContext(ExtraConfigContext);

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

  const oidcProps: Partial<LoginTemplateProps> = {};
  if (oidc?.enabled) {
    oidcProps.urlOidcLogin = oidc.loginUrl;
    oidcProps.labelOidcLogin = "Organisatie login";
  }

  console.log(oidc, oidcProps, props);

  return (
    <LoginTemplate
      slotPrimaryNavigation={<></>} // FIXME: Should be easier to override
      formProps={{
        nonFieldErrors: nonFieldErrors || detail,
        errors,
        fields,
        onSubmit: (_, data) =>
          submit(data as AttributeData<string>, { method: "POST" }),
      }}
      {...oidcProps}
      {...props}
    />
  );
}
