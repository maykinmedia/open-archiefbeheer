import { AttributeData, LoginTemplate } from "@maykin-ui/admin-ui";
import { useActionData, useSubmit } from "react-router-dom";

import "./Login.css";

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
        onSubmit: (_, data) =>
          submit(data as AttributeData<string>, { method: "POST" }),
      }}
      {...props}
    />
  );
}
