import { request } from "./request";

interface HealthCheckError {
  model: string;
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  field?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  errors: HealthCheckError[];
}

/**
 * List destruction lists.
 */
export async function getHealthCheck(): Promise<HealthCheckResponse> {
  const response = await request("GET", "/health-check");
  const promise: Promise<HealthCheckResponse> = response.json();
  return promise;
}
