import { LoginTemplate } from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
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
  } catch (e: unknown) {
    return await (e as Response).json();
  }
}

export type LoginProps = React.ComponentProps<"main"> & {
  // Props here.
};

/**
 * Login page
 */
export function LoginPage({ ...props }: LoginProps) {
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
    <LoginTemplate
      slotPrimaryNavigation={<></>} // FIXME: Shoudl be easier to override
      formProps={{
        nonFieldErrors,
        errors,
        fields,
        onSubmit: (_, data) => submit(data, { method: "POST" }),
      }}
      {...props}
    />
  );
}
