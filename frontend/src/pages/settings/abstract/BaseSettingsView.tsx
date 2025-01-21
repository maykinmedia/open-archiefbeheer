import {
  CardBaseTemplate,
  DataGridProps,
  ListTemplate,
  ToolbarItem,
} from "@maykin-ui/admin-ui";
import React from "react";
import { useMatches, useNavigate } from "react-router-dom";

export type BaseSettingsPageProps<T extends object> = React.PropsWithChildren<{
  dataGridProps?: DataGridProps<T>;
  secondaryNavigationItems?: ToolbarItem[];
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

  const SIDEBAR_ITEMS: ToolbarItem[] = [
    {
      children: "Verkorte procedure",
      align: "start",
      onClick: () => navigate("/settings/short-procedure"),
      active: currentPathName === "/settings/short-procedure",
    },
    {
      children: "Vernietigingsrapport",
      align: "start",
      onClick: () => navigate("/settings/destruction-report"),
      active: currentPathName === "/settings/destruction-report",
    },
  ];

  if (dataGridProps) {
    return (
      <ListTemplate
        dataGridProps={{ height: "fill-available-space", ...dataGridProps }}
        secondaryNavigationItems={secondaryNavigationItems}
        sidebarItems={SIDEBAR_ITEMS}
      >
        {children}
      </ListTemplate>
    );
  }

  return (
    <CardBaseTemplate
      secondaryNavigationItems={secondaryNavigationItems}
      sidebarItems={SIDEBAR_ITEMS}
    >
      {children}
    </CardBaseTemplate>
  );
}
