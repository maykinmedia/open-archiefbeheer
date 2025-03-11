import { Button, Card, H3, Hr, useDialog } from "@maykin-ui/admin-ui";
import { useCallback } from "react";

export type LogoProps = {
  width?: number;
  withDialog?: boolean;
};

function LogoImage({ width }: { width: number }) {
  return <img src="/logo.svg" alt="Open Archiefbeheer Logo" width={width} />;
}

export function Logo({ width = 128, withDialog = false }: LogoProps) {
  const dialog = useDialog();

  const onClick = useCallback(() => {
    dialog(
      "Versie",
      <Card>
        <LogoImage width={128} />
        <H3>Versie</H3>
        <Hr />
      </Card>,
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
