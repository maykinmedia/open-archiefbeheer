import {
  ArchiveConfiguration,
  getArchiveConfiguration,
} from "../../lib/api/config";
import { ZaaktypeChoice, listZaaktypeChoices } from "../../lib/api/private";
import {
  canViewAndEditSettingsRequired,
  loginRequired,
} from "../../lib/auth/loaders";

export type SettingsContext = {
  zaaktypesShortProcess: ArchiveConfiguration["zaaktypesShortProcess"];
  zaaktypeChoices: ZaaktypeChoice[];
};

export const settingsLoader = loginRequired(
  canViewAndEditSettingsRequired(async (): Promise<SettingsContext> => {
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
  }),
);
