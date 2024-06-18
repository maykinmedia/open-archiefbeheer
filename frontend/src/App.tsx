import {
  BreadcrumbItem,
  Logo,
  NavigationContext,
  Outline,
  formatMessage,
} from "@maykin-ui/admin-ui";
import { Outlet, useMatches, useNavigate } from "react-router-dom";

import "./App.css";

function App() {
  const navigate = useNavigate();
  const matches = useMatches();
  const match = matches[matches.length - 1];
  const handle = match?.handle as Record<string, unknown>;

  const breadcrumbItems = (
    (handle?.breadcrumbItems || []) as BreadcrumbItem[]
  ).map((b) => ({
    label: formatMessage(b.label, match?.params as Record<string, string>),
    href: formatMessage(b.href, match?.params as Record<string, string>),
  }));

  return (
    <div className="App">
      <NavigationContext.Provider
        value={{
          breadcrumbItems,
          primaryNavigationItems: [
            <Logo
              key="logo"
              variant={"compact"}
              style={{ width: "32px", ["--page-color-logo"]: "#FFF" }}
            />,
            {
              children: <Outline.HomeIcon />,
              title: "Home",
              onClick: () => navigate("/destruction-lists/"),
            },
            {
              children: <Outline.PlusCircleIcon />,
              title: "Add destruction list",
              onClick: () => navigate("/destruction-lists/create"),
            },
            "spacer",
            {
              children: <Outline.ArrowRightOnRectangleIcon />,
              title: "Uitloggen",
              onClick: () => navigate("/logout"),
            },
          ],
        }}
      >
        <Outlet />
      </NavigationContext.Provider>
    </div>
  );
}

export default App;
