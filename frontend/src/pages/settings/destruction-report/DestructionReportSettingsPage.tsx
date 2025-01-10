import { useMemo } from "react";

import { BaseSettingsView } from "../abstract/BaseSettingsView";

interface DestructionReportSetting {
  zaaktype: string;
  value: string | number;
  verkorteProcedure: boolean;
}

/**
 * Allows for configuring zaaktype eligible for the short procedure.
 */
export function DestructionReportSettingsPage() {
  const objectList = useMemo(() => [], []);

  return (
    <BaseSettingsView<DestructionReportSetting>
      secondaryNavigationItems={[]}
      dataGridProps={{
        objectList,
      }}
    ></BaseSettingsView>
  );
}
