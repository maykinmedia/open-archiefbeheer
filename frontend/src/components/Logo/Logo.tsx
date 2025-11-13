import { AttributeList, Button, Card, P, useDialog } from "@maykin-ui/admin-ui";
import { useCallback } from "react";

import { useDataFetcher } from "../../hooks/useDataFetcher";
import { getAppInfo } from "../../lib/api/app-info";
// eslint-disable-next-line import/no-unresolved
import logoUrl from "/logo.svg";

export type LogoProps = {
  width?: number | string;
  withDialog?: boolean;
};

/**
 * Implementation of the LogoImage with optional interactivity
 */
export function Logo({ width = 128, withDialog = false }: LogoProps) {
  const dialog = useDialog();

  const onClick = useCallback(() => {
    dialog("Over", <DialogBody />, undefined, { size: "s" });
  }, [dialog]);

  return withDialog ? (
    <Button variant="transparent" onClick={onClick} pad={false}>
      <LogoImage width={width} />
    </Button>
  ) : (
    <LogoImage width={width} />
  );
}

function DialogBody() {
  const { data: appInfo } = useDataFetcher(
    (signal) => getAppInfo(signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de versieinfo!",
    },
    [],
  );

  const object = {
    Versie: <P size="xs">{appInfo?.release}</P>,
    "Git SHA": <P size="xs">{appInfo?.gitSha}</P>,
  };

  return (
    <Card>
      <LogoImage width={"100%"} />
      <AttributeList
        fields={Object.keys(object) as keyof object}
        object={object}
      />
    </Card>
  );
}

/**
 * Purely the image of the logo, without any interactivity.
 */
function LogoImage({ width }: { width: number | string }) {
  return <img src={logoUrl} alt="Open Archiefbeheer Logo" width={width} />;
}
