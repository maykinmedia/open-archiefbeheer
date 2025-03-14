import { Button, Card, useDialog } from "@maykin-ui/admin-ui";
import { useCallback } from "react";

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
    dialog(
      "Over",
      <Card>
        <LogoImage width={"100%"} />
      </Card>,
      undefined,
      { size: "s" },
    );
  }, [dialog]);

  return withDialog ? (
    <Button variant="transparent" onClick={onClick} pad={false}>
      <LogoImage width={width} />
    </Button>
  ) : (
    <LogoImage width={width} />
  );
}

/**
 * Purely the image of the logo, without any interactivity.
 */
function LogoImage({ width }: { width: number | string }) {
  return <img src={logoUrl} alt="Open Archiefbeheer Logo" width={width} />;
}
