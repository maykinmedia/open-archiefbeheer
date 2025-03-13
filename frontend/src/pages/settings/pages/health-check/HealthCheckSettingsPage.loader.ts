import {
  HealthCheckResponse,
  getHealthCheck,
} from "../../../../lib/api/health-check";
import {
  canViewAndEditSettingsRequired,
  loginRequired,
} from "../../../../lib/auth/loaders";

export type HealthCheckSettingsPageContext = HealthCheckResponse;

export const healthCheckSettingsLoader = loginRequired(
  canViewAndEditSettingsRequired(
    async (): Promise<HealthCheckSettingsPageContext> => {
      return await getHealthCheck(new AbortController().signal);
    },
  ),
);
