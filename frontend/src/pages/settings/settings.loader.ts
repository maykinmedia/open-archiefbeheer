import { ActionFunctionArgs } from "react-router-dom";

import { GetArchiveConfigReturn, getArchiveConfig } from "../../lib/api/config";
import { ZaaktypeChoice, listZaaktypeChoices } from "../../lib/api/private";
import { loginRequired } from "../../lib/auth/loaders";

export type SettingsContext = {
  zaaktypesShortProcess: GetArchiveConfigReturn["zaaktypesShortProcess"];
  zaaktypeChoices: ZaaktypeChoice[];
};

export const settingsLoader = loginRequired(
  async ({ request }: ActionFunctionArgs): Promise<SettingsContext> => {
    const archiveConfigPromise = getArchiveConfig();
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
);
