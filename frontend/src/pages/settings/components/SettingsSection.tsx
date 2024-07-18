import { Card, Column, P } from "@maykin-ui/admin-ui";

export interface SettingsSectionProps {
  settingTitle: string;
  settingDescription: string;
  children: React.ReactNode;
}

export const SettingsSection = ({
  children,
  settingDescription,
  settingTitle,
}: SettingsSectionProps) => (
  <>
    <Column span={1}>
      <P bold size="s">
        {settingTitle}
      </P>
      <P size="xs">{settingDescription}</P>
    </Column>
    <Column span={2}>
      <Card>{children}</Card>
    </Column>
  </>
);
