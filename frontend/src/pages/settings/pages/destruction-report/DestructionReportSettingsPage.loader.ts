import { Option } from "@maykin-ui/admin-ui";

import {
  ArchiveConfiguration,
  getArchiveConfiguration,
} from "../../../../lib/api/config";
import {
  listInformatieObjectTypeChoices,
  listResultaatTypeChoices,
  listSelectielijstKlasseChoices,
  listStatusTypeChoices,
  listZaaktypeChoices,
} from "../../../../lib/api/private";
import {
  canViewAndEditSettingsRequired,
  loginRequired,
} from "../../../../lib/auth/loaders";

export type DestructionReportSettingsPageContext = {
  archiveConfiguration: ArchiveConfiguration;
  informatieObjectTypeChoices: Option[];
  resultaatTypeChoices: Option[];
  selectieLijstKlasseChoices: Option[];
  statusTypeChoices: Option[];
  zaaktypeChoices: Option[];
};

export const destructionReportSettingsPageLoader = loginRequired(
  canViewAndEditSettingsRequired(
    async (): Promise<DestructionReportSettingsPageContext> => {
      const [
        archiveConfiguration,
        informatieObjectTypeChoices,
        resultaatTypeChoices,
        selectieLijstKlasseChoices,
        statusTypeChoices,
        zaaktypeChoices,
      ] = await Promise.all([
        getArchiveConfiguration(),
        listInformatieObjectTypeChoices(),
        listResultaatTypeChoices(),
        listSelectielijstKlasseChoices(),
        listStatusTypeChoices(),
        listZaaktypeChoices(),
      ]);

      return {
        archiveConfiguration,
        informatieObjectTypeChoices,
        resultaatTypeChoices,
        selectieLijstKlasseChoices,
        statusTypeChoices,
        zaaktypeChoices,
      };
    },
  ),
);
