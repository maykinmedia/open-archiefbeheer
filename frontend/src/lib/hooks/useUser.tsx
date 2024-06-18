import { useEffect } from "react";
import { useSessionStorage } from "react-use";

import { User, whoAmI } from "../api/auth";

export const USER_SESSION_KEY = "oab.lib.hooks.user";

export const useUser = (): { user: User | null } => {
  const [user, setUser] = useSessionStorage<User | null>(
    USER_SESSION_KEY,
    null,
  );

  useEffect(() => {
    const fetchUser = async () => {
      const response = await whoAmI();
      setUser(response || null);
    };

    if (!user) {
      fetchUser();
    }
  }, [user]);

  return { user };
};
