import { Logo, NavigationContext, Outline } from "@maykin-ui/admin-ui";
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";

import "./App.css";

function App() {
  const navigate = useNavigate();

  return (
    <div className="App">
      <NavigationContext.Provider
        value={{
          primaryNavigationItems: [
            <Logo
              key="logo"
              variant={"compact"}
              style={{ width: "32px", ["--page-color-logo"]: "#FFF" }}
            />,
            {
              children: <Outline.HomeIcon />,
              title: "Home",
              onClick: () => navigate("/"),
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
