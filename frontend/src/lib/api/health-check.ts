import { request } from "./request";

export type Severity = "error" | "warning" | "info";

export interface ExtraInfo {
  model: string;
  code: string;
  message?: string;
  severity: Severity;
  field?: string;
}

export interface HealthCheckResult {
  message: string;
  success: boolean;
  identifier: string;
  extra?: ExtraInfo[];
}

/**
 * List destruction lists.
 */
export async function getHealthCheck(
  signal?: AbortSignal,
): Promise<HealthCheckResult[]> {
  const response = await request(
    "GET",
    "/health-check",
    undefined,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<HealthCheckResult[]> = response.json();
  return promise;
}
