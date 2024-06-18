import { useAsync, useSessionStorage } from "react-use";

import { User, whoAmI } from "../api/auth";

export const USER_SESSION_KEY = "oab.lib.hooks.user";

export const useUser = (): { user: User | null } => {
  // Note: Possible improvement -> loading state? But this would require to handle this in the UI aswell. Maybe for the future
  const [user, setUser] = useSessionStorage<User | null>(
    USER_SESSION_KEY,
    null,
  );

  useAsync(async () => {
    if (user) {
      return;
    }
    const response = await whoAmI();
    setUser(response || null);
  }, [user]);

  return { user };
};
