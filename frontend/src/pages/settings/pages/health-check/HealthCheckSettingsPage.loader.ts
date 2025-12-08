import {
  HealthCheckResult,
  getHealthCheck,
} from "../../../../lib/api/health-check";
import {
  canViewAndEditSettingsRequired,
  loginRequired,
} from "../../../../lib/auth/loaders";

export const healthCheckSettingsLoader = loginRequired(
  canViewAndEditSettingsRequired(async (): Promise<HealthCheckResult[]> => {
    return await getHealthCheck(new AbortController().signal);
  }),
);
