import { Badge, Body, Solid } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { HealthCheckResult, Severity } from "../../../../lib/api/health-check";
import { BaseSettingsView } from "../../abstract/BaseSettingsView";

/**
 * Check the health of certain services that require configuring
 */
export function HealthCheckSettingsPage() {
  const failedChecks = useLoaderData() as HealthCheckResult[];
  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "error":
        return (
          <Badge
            variant="danger"
            style={{
              display: "block",
              border: "none",
              transformStyle: "flat",
            }}
          >
            <Solid.XCircleIcon role="img" aria-label="Error" />
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="warning"
            style={{
              display: "block",
              border: "none",
              transformStyle: "flat",
            }}
          >
            <Solid.ExclamationTriangleIcon role="img" aria-label="Warning" />
          </Badge>
        );
      case "info":
        return (
          <Badge
            variant="info"
            style={{
              display: "block",
              border: "none",
              transformStyle: "flat",
            }}
          >
            <Solid.InformationCircleIcon role="img" aria-label="Info" />
          </Badge>
        );
      default:
        return <></>;
    }
  };

  const getFormattedCheckResults = () => {
    const formattedResult = [];
    for (const result of failedChecks) {
      for (const extraInfo of result.extra || []) {
        formattedResult.push({
          Niveau: getSeverityBadge(extraInfo.severity),
          Bericht: extraInfo.message || result.message,
          Model: extraInfo.model,
          Veld: extraInfo.field,
        });
      }
    }
    return formattedResult;
  };

  return (
    <BaseSettingsView
      dataGridProps={{ objectList: getFormattedCheckResults() }}
      secondaryNavigationItems={[
        {
          children: (
            <>
              <Solid.LinkIcon />
              Naar de Admin
            </>
          ),
          pad: "h",
          variant: "info",
          href: "/admin",
        },
      ]}
    >
      {failedChecks.length === 0 && (
        <Body>Geen configuratie fouten gevonden. </Body>
      )}
    </BaseSettingsView>
  );
}
