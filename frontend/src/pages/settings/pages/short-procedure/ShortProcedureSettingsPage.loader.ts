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

export type ShortProcedureSettingsPageContext = {
  zaaktypesShortProcess: ArchiveConfiguration["zaaktypesShortProcess"];
  zaaktypeChoices: Option[];
};

export const shortProcedureSettingsPageLoader = loginRequired(
  canViewAndEditSettingsRequired(
    async (): Promise<ShortProcedureSettingsPageContext> => {
      const archiveConfigPromise = getArchiveConfiguration();
      const zaaktypeChoicesPromise = listZaaktypeChoices();

      const [archiveConfig, zaaktypeChoices] = await Promise.all([
        archiveConfigPromise,
        zaaktypeChoicesPromise,
      ]);

      return {
        zaaktypesShortProcess: archiveConfig.zaaktypesShortProcess,
        zaaktypeChoices,
      };
    },
  ),
);
