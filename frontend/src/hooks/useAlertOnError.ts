import { useAlert } from "@maykin-ui/admin-ui";

import { collectErrors } from "../lib/format/error";

/**
 * Hook providing a catch handler for hooks implementing data fetching.
 * Catch handler shows errors using `useAlert`.
 * @param defaultMessage A default error message shown if the error message
 *  cannot be determined.
 */
export const useAlertOnError = (defaultMessage: string) => {
  const alert = useAlert();
  return async (e: unknown) => {
    const errorJsonBody = e instanceof Response ? await e.json() : null;

    const { onConfirm, confirmLabel } = getAlertOptions(errorJsonBody);
    const errors = e instanceof Response ? collectErrors(errorJsonBody) : [];
    const message = errors.length ? errors.join(", ") : defaultMessage;

    console.error(e, errors);
    alert("Foutmelding", message, confirmLabel, onConfirm);
  };
};

/**
 * Determines the options for the alert based on the error response.
 * @param errorJsonBody The parsed JSON body of the error response.
 * @returns { onConfirm, confirmLabel } Options for the alert.
 */
function getAlertOptions(errorJsonBody?: { code: string }): {
  onConfirm?: () => void;
  confirmLabel: string;
} {
  if (errorJsonBody?.code === "session_expired") {
    return {
      onConfirm: () => {
        window.location.href = "/login";
      },
      confirmLabel: "Log in",
    };
  }

  return {
    onConfirm: undefined,
    confirmLabel: "Ok",
  };
}
