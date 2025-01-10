import { DataGridProps, ListTemplate, ToolbarItem } from "@maykin-ui/admin-ui";
import React from "react";

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
  return (
    <ListTemplate<T>
      secondaryNavigationItems={secondaryNavigationItems}
      dataGridProps={dataGridProps}
    >
      {children}
    </ListTemplate>
  );
}
