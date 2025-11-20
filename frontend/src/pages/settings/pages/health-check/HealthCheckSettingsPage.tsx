import { Badge, Body, Solid } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { BaseSettingsView } from "../../abstract/BaseSettingsView";
import { HealthCheckSettingsPageContext } from "./HealthCheckSettingsPage.loader";
import { HealthCheckResult } from "../../../../lib/api/health-check";

/**
 * Check the health of certain services that require configuring
 */
export function HealthCheckSettingsPage() {
  const failedChecks = useLoaderData() as HealthCheckSettingsPageContext;
  const failedChecksKeys = Object.keys(failedChecks);
  const sortedfailedChecksKeys = failedChecksKeys.sort();
  const getSeverityBadge = (
    severity: HealthCheckResult["severity"],
  ) => {
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

  return (
    <BaseSettingsView
      dataGridProps={{
        objectList: sortedfailedChecksKeys.map((checkKey) => {
          const check = failedChecks[checkKey];
          return {
            Model: check.model,
            Niveau: getSeverityBadge(check.severity),
            Bericht: check.message,
            Veld: check.field,
          };
        }),
      }}
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
      {failedChecksKeys.length === 0 && <Body>Geen configuratie fouten gevonden. </Body>}
    </BaseSettingsView>
  );
}
