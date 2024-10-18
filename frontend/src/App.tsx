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
  ModalService,
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
import { User, getOIDCInfo, whoAmI } from "./lib/api/auth";
import { canStartDestructionList } from "./lib/auth/permissions";
import OidcConfigContext, {
  OidcConfigContextType,
} from "./lib/contexts/OidcConfigContext";
import { formatUser } from "./lib/format/user";

function App() {
  const { state } = useNavigation();
  const navigate = useNavigate();
  const matches = useMatches();
  const match = matches[matches.length - 1];
  const handle = match?.handle as Record<string, unknown>;

  const [user, setUser] = useState<User | null>(null);
  const [oidcInfo, setOidcInfo] = useState<OidcConfigContextType>({
    enabled: false,
    loginUrl: "",
  });

  useAsync(async () => {
    const user = await whoAmI();
    setUser(user);
  }, [state]);

  useAsync(async () => {
    const info = await getOIDCInfo();
    setOidcInfo(info);
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
              hidden: user ? !canStartDestructionList(user) : true,
              // size: "xl",
              onClick: () => navigate("/destruction-lists/create"),
            },
            "spacer",
            <>
              {state !== "idle" ? (
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
        <OidcConfigContext.Provider value={oidcInfo}>
          <ModalService>
            <Outlet />
          </ModalService>
        </OidcConfigContext.Provider>
      </NavigationContext.Provider>
    </div>
  );
}

export default App;
