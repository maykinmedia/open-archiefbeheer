import { Login } from "@maykin-ui/admin-ui";
import "@maykin-ui/admin-ui/style";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import React from "react";
import { redirect, useActionData, useSubmit } from "react-router-dom";

import { login } from "../../lib/api/auth";
import "./Login.css";

/**
 * React Router action.
 * @param request
 */
export async function loginAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    await login(username as string, password as string);
    return redirect("/");
  } catch (e: any) {
    return await e.json();
  }
}

export type LoginProps = React.ComponentProps<"main"> & {
  // Props here.
};

/**
 * Login page
 */
export function LoginPage({ children, ...props }: LoginProps) {
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
    Object.entries(actionData).map(([key, values]) => [key, values.join(", ")]),
  );
  const { nonFieldErrors, ...errors } = formErrors;

  return (
    <Login
      formProps={{
        nonFieldErrors,
        errors,
        fields,
        onSubmit: (_, data) => submit(data, { method: "POST" }),
      }}
    />
  );
}
