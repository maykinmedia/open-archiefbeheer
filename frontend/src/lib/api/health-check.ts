import { request } from "./request";

export interface HealthCheckResult {
  model: string;
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  field?: string;
  success: boolean;
}

export interface HealthCheckResponse {
  [key: string]: HealthCheckResult;
}

/**
 * List destruction lists.
 */
export async function getHealthCheck(
  signal?: AbortSignal,
): Promise<HealthCheckResponse> {
  const response = await request(
    "GET",
    "/health-check",
    undefined,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<HealthCheckResponse> = response.json();
  return promise;
}
