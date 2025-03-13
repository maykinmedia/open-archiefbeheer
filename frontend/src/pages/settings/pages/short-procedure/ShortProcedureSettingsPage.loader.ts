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
      const abortController = new AbortController();
      const abortSignal = abortController.signal;
      const archiveConfigPromise = getArchiveConfiguration(abortSignal);
      const zaaktypeChoicesPromise = listZaaktypeChoices(
        undefined,
        false,
        abortSignal,
      );

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
