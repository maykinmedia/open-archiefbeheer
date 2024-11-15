import { useAlert } from "@maykin-ui/admin-ui";

import { collectErrors } from "../lib/format/error";

/**
 * Hook providing catch handler for hooks implementing data fetching.
 * Catch handler shows errors using `useAlert`.
 * @param defaultMessage A default error message shown if the error message
 *  cannot be determined.
 */
export const useAlertOnError = (defaultMessage: string) => {
  const alert = useAlert();
  return async (e: unknown) => {
    const errors = e instanceof Response ? collectErrors(await e.json()) : [];
    const message = errors.length ? errors.join() : defaultMessage;

    console.error(e, errors);
    alert("Foutmelding", message, "Ok");
  };
};
