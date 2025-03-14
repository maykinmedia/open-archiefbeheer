import { Option } from "@maykin-ui/admin-ui";

import {
  ArchiveConfiguration,
  getArchiveConfiguration,
} from "../../../../lib/api/config";
import { listZaaktypeChoices } from "../../../../lib/api/private";
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
        listZaaktypeChoices(undefined, true, abortSignal),
      ]);

      return {
        archiveConfiguration,
        zaaktypeChoices,
      };
    },
  ),
);
