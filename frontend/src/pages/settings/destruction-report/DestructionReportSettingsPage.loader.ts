import { loginRequired } from "../../../lib/auth/loaders";

export type DestructionReportSettingsPageContext = object;

export const destructionReportSettingsPageLoader = loginRequired(
  async (): Promise<DestructionReportSettingsPageContext> => {
    return {};
  },
);
