import {
  Body,
  BreadcrumbItem,
  ButtonLink,
  Card,
  Column,
  Dropdown,
  Grid,
  H3,
  Hr,
  IconInitials,
  Logo,
  NavigationContext,
  Outline,
  P,
  Solid,
  formatMessage,
} from "@maykin-ui/admin-ui";
import { useState } from "react";
import {
  Outlet,
  useMatches,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { useAsync } from "react-use";

import "./App.css";
import { User, whoAmI } from "./lib/api/auth";
import { formatUser } from "./lib/format/user";

function App() {
  const { state } = useNavigation();
  const navigate = useNavigate();
  const matches = useMatches();
  const match = matches[matches.length - 1];
  const handle = match?.handle as Record<string, unknown>;

  const [user, setUser] = useState<User | null>(null);

  useAsync(async () => {
    const user = await whoAmI();
    setUser(user);
  }, [state]);

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
              href="https://www.maykinmedia.nl"
              key="logo"
              abbreviated={true}
              variant="contrast"
            />,
            {
              children: <Solid.HomeIcon />,
              title: "Home",
              // size: "xl",
              onClick: () => navigate("/destruction-lists/"),
            },
            {
              children: <Solid.DocumentPlusIcon />,
              title: "Vernietigingslijst opstellen",
              // size: "xl",
              onClick: () => navigate("/destruction-lists/create"),
            },
            "spacer",
            <>
              {state === "loading" ? (
                <P title="Bezig met laden...">
                  <Solid.ArrowPathIcon
                    spin
                    stroke="var(--button-color-text-primary)"
                  />
                </P>
              ) : undefined}
            </>,
            {
              children: <Outline.CogIcon />,
              title: "Settings",
              // size: "xl",
              onClick: () => navigate("/settings"),
            },
            <Dropdown
              key="account"
              label={
                <IconInitials
                  name={
                    user
                      ? formatUser(user as User, { showUsername: false })
                      : ""
                  }
                />
              }
              pad="v"
            >
              <Body>
                <Card>
                  <H3>Account</H3>
                  <Hr />
                  <Grid>
                    <Column containerType="normal" span={2}>
                      <IconInitials
                        name={
                          user
                            ? formatUser(user as User, { showUsername: false })
                            : ""
                        }
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
                    <Column span={6} />
                    <Column span={6}>
                      <ButtonLink
                        href={"/logout"}
                        variant="outline"
                        wrap={false}
                      >
                        <Solid.ArrowRightEndOnRectangleIcon />
                        Uitloggen
                      </ButtonLink>
                    </Column>
                  </Grid>
                </Card>
              </Body>
            </Dropdown>,
          ],
        }}
      >
        <Outlet />
      </NavigationContext.Provider>
    </div>
  );
}

export default App;
