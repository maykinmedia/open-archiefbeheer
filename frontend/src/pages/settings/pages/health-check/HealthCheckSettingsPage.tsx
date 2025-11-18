import { Badge, Solid } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { BaseSettingsView } from "../../abstract/BaseSettingsView";
import { HealthCheckSettingsPageContext } from "./HealthCheckSettingsPage.loader";

/**
 * Check the health of certain services that require configuring
 */
export function HealthCheckSettingsPage() {
  const { errors } = useLoaderData() as HealthCheckSettingsPageContext;
  const sortedErrors = errors.sort((a, b) => a.model.localeCompare(b.model));
  const getSeverityBadge = (
    severity: HealthCheckSettingsPageContext["errors"][0]["severity"],
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
        objectList: sortedErrors.map((error) => ({
          Model: error.model,
          Niveau: getSeverityBadge(error.severity),
          Bericht: error.message,
          Veld: error.field,
        })),
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
    />
  );
}
