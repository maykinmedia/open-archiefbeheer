import { useEffect } from "react";
import { Outlet, useNavigate, useOutlet } from "react-router-dom";

/**
 * Destruction list detail page
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const outlet = useOutlet();

  // Redirect
  useEffect(() => {
    if (!outlet) {
      navigate("short-procedure");
    }
  }, [outlet]);

  return <Outlet />;
}
