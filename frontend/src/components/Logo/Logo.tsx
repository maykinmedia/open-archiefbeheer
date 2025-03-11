import { Body, Card, Dropdown, H3, Hr } from "@maykin-ui/admin-ui";

export type LogoProps = {
  width?: number;
};

export function Logo({ width }: LogoProps) {
  return <img src="/logo.svg" alt="Open Archiefbeheer Logo" width={width} />;
}

export function LogoDialog({ width = 128 }: LogoProps) {
  return (
    <Dropdown
      aria-label="Versie"
      label={<Logo width={width} />}
      pad="v"
      variant="transparent"
      placement="right"
      activateOnHover={false}
    >
      <Body>
        <Card>
          <Logo width={128} />
          <H3>Versies</H3>
          <Hr />
          {/* TODO: Version info */}
        </Card>
      </Body>
    </Dropdown>
  );
}
