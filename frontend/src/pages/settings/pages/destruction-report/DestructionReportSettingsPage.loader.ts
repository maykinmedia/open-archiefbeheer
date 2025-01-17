import { Option } from "@maykin-ui/admin-ui";

import {
  ArchiveConfiguration,
  getArchiveConfiguration,
} from "../../../../lib/api/config";
import {
  listSelectielijstKlasseChoices,
  listZaaktypeChoices,
} from "../../../../lib/api/private";
import {
  canViewAndEditSettingsRequired,
  loginRequired,
} from "../../../../lib/auth/loaders";

export type DestructionReportSettingsPageContext = {
  archiveConfiguration: ArchiveConfiguration;
  selectieLijstKlasseChoices: Option[];
  zaaktypeChoices: Option[];
};

export const destructionReportSettingsPageLoader = loginRequired(
  canViewAndEditSettingsRequired(
    async (): Promise<DestructionReportSettingsPageContext> => {
      const [
        archiveConfiguration,
        selectieLijstKlasseChoices,
        zaaktypeChoices,
      ] = await Promise.all([
        getArchiveConfiguration(),
        listSelectielijstKlasseChoices(),
        listZaaktypeChoices(undefined, undefined, undefined, true),
      ]);

      return {
        archiveConfiguration,
        selectieLijstKlasseChoices,
        zaaktypeChoices,
      };
    },
  ),
);
