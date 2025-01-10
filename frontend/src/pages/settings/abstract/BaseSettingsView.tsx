import { DataGridProps, ListTemplate, ToolbarItem } from "@maykin-ui/admin-ui";
import React from "react";
import { useMatches, useNavigate } from "react-router-dom";

export type BaseSettingsPageProps<T extends object> = React.PropsWithChildren<{
  dataGridProps: DataGridProps<T>;
  secondaryNavigationItems: ToolbarItem[];
}>;

/**
 * Base view for settings pages.
 */
export function BaseSettingsView<T extends object>({
  children,
  dataGridProps,
  secondaryNavigationItems,
}: BaseSettingsPageProps<T>) {
  const navigate = useNavigate();
  const currentMatch = [...useMatches()].pop(); // Explicit clone.
  const currentPathName = currentMatch?.pathname;

  return (
    <ListTemplate<T>
      secondaryNavigationItems={secondaryNavigationItems}
      sidebarItems={[
        {
          children: "Verkorte procedure",
          align: "start",
          onClick: () => navigate("/settings/short-procedure"),
          active: currentPathName === "/settings/short-procedure",
        },
      ]}
      dataGridProps={dataGridProps}
    >
      {children}
    </ListTemplate>
  );
}
