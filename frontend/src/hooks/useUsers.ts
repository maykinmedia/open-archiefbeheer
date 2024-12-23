import { useEffect, useState } from "react";

import { User } from "../lib/api/auth";
import { listUsers } from "../lib/api/users";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving users
 */
export function useUsers(): User[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van gebruikers!",
  );

  const [usersState, setUsersState] = useState<User[]>([]);
  useEffect(() => {
    listUsers()
      .then((r) => setUsersState(r))
      .catch(alertOnError);
  }, []);

  return usersState;
}
