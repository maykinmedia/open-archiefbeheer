import { Option } from "@maykin-ui/admin-ui";

import {
  ArchiveConfiguration,
  getArchiveConfiguration,
} from "../../../../lib/api/config";
import { listDestructionReportZaaktypeChoices } from "../../../../lib/api/private";
import {
  canViewAndEditSettingsRequired,
  loginRequired,
} from "../../../../lib/auth/loaders";

export type DestructionReportSettingsPageContext = {
  archiveConfiguration: ArchiveConfiguration;
  zaaktypeChoices: Option[];
};

export const destructionReportSettingsPageLoader = loginRequired(
  canViewAndEditSettingsRequired(
    async (): Promise<DestructionReportSettingsPageContext> => {
      const abortController = new AbortController();
      const abortSignal = abortController.signal;
      const [archiveConfiguration, zaaktypeChoices] = await Promise.all([
        getArchiveConfiguration(abortSignal),
        listDestructionReportZaaktypeChoices(abortSignal),
      ]);

      return {
        archiveConfiguration,
        zaaktypeChoices,
      };
    },
  ),
);
