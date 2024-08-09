import {
  BreadcrumbItem,
  Button,
  Card,
  Column,
  Grid,
  H3,
  Hr,
  Iconinitials,
  Logo,
  NavigationContext,
  Outline,
  P,
  Tooltip,
  formatMessage,
} from "@maykin-ui/admin-ui";
import { useState } from "react";
import { Outlet, useMatches, useNavigate } from "react-router-dom";
import { useAsync } from "react-use";

import "./App.css";
import { User, whoAmI } from "./lib/api/auth";

function App() {
  const navigate = useNavigate();
  const matches = useMatches();
  const match = matches[matches.length - 1];
  const handle = match?.handle as Record<string, unknown>;

  const [user, setUser] = useState<User | null>(null);

  useAsync(async () => {
    const user = await whoAmI();
    setUser(user);
  }, []);

  const breadcrumbItems = (
    (handle?.breadcrumbItems || []) as BreadcrumbItem[]
  ).map((b) => ({
    label: formatMessage(b.label, match?.params as Record<string, string>),
    href: formatMessage(b.href, match?.params as Record<string, string>),
  }));

  const getUserInitials = (user: User | null) => {
    if (!user) return "";
    return user.firstName.charAt(0) + user.lastName.charAt(0);
  };

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
              title: "Vernietigingslijst opstellen",
              onClick: () => navigate("/destruction-lists/create"),
            },
            "spacer",
            {
              children: <Outline.CogIcon />,
              title: "Settings",
              onClick: () => navigate("/settings"),
            },
            {
              children: (
                <Tooltip
                  keepOpenOnHover
                  content={
                    <Card>
                      <H3>Account</H3>
                      <Hr />
                      <Grid>
                        <Column span={2}>
                          <Iconinitials
                            size="32px"
                            initials={getUserInitials(user)}
                          />
                        </Column>
                        <Column span={8}>
                          <Grid gutter={false}>
                            <Column span={12}>
                              <P bold>
                                {user?.firstName} {user?.lastName}
                              </P>
                            </Column>
                            <Column span={12}>
                              <P>{user?.role.name}</P>
                            </Column>
                            <Column span={12}>
                              <P muted>{user?.email}</P>
                            </Column>
                          </Grid>
                        </Column>
                        <Hr />
                        <Column span={9}>
                          <P>Uitloggen</P>
                        </Column>
                        <Column span={2}>
                          <Button
                            variant="outline"
                            onClick={() => navigate("/logout")}
                          >
                            <Outline.ArrowRightOnRectangleIcon />
                          </Button>
                        </Column>
                      </Grid>
                    </Card>
                  }
                  placement={"right-start"}
                  size="lg"
                >
                  <div>
                    <Iconinitials
                      size="14px"
                      initials={getUserInitials(user)}
                    />
                  </div>
                </Tooltip>
              ),
              title: "Uitloggen",
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
