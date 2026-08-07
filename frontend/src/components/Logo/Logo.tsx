import { AttributeList, Button, Card, P, useDialog } from "@maykin-ui/admin-ui";
import { useCallback } from "react";

import { useDataFetcher } from "../../hooks/useDataFetcher";
// eslint-disable-next-line import/no-unresolved
import iconUrl from "../../img/open-archiefbeheer-icon.svg";
// eslint-disable-next-line import/no-unresolved
import logoUrl from "../../img/open-archiefbeheer-logo.svg";
import { getAppInfo } from "../../lib/api/app-info";

export type LogoProps = {
  width?: number | string;
  withDialog?: boolean;
  withIcon?: boolean;
};

/**
 * Implementation of the LogoImage with optional interactivity
 */
export function Logo({
  width = 128,
  withDialog = false,
  withIcon = false,
}: LogoProps) {
  const dialog = useDialog();

  const onClick = useCallback(() => {
    dialog("Over", <DialogBody />, undefined, { size: "s" });
  }, [dialog]);

  return withDialog ? (
    <Button variant="transparent" onClick={onClick} pad={false}>
      <LogoImage width={width} withIcon={withIcon} />
    </Button>
  ) : (
    <LogoImage width={width} withIcon={withIcon} />
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
function LogoImage({
  width,
  withIcon = false,
}: {
  width: number | string;
  withIcon?: boolean;
}) {
  return (
    <img
      src={withIcon ? iconUrl : logoUrl}
      alt={withIcon ? "Open Archiefbeheer Icon" : "Open Archiefbeheer Logo"}
      width={width}
    />
  );
}
