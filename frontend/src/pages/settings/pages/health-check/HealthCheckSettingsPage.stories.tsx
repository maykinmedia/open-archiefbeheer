import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../../.storybook/decorators";
import { MOCK_BASE } from "../../../../../.storybook/mockData";
import { administratorFactory } from "../../../../fixtures";
import { settingsAction } from "../../Settings.action";
import { HealthCheckSettingsPage } from "./HealthCheckSettingsPage";
import { healthCheckSettingsLoader } from "./HealthCheckSettingsPage.loader";

const meta: Meta<typeof HealthCheckSettingsPage> = {
  title: "Pages/Settings/Health Check",
  component: HealthCheckSettingsPage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const HEALTH_CHECK_FIXTURE = {
  success: false,
  errors: [
    {
      model: "openarchiefbeheer.config.ArchiveConfig",
      field: "bronorganisatie",
      code: "MISSING_BRONORGANISATIE",
      message:
        "No source organisation for the destruction report case configured.",
      severity: "error",
    },
    {
      model: "openarchiefbeheer.config.ArchiveConfig",
      field: "zaaktype",
      code: "MISSING_ZAAKTYPE",
      message: "No zaaktype for the destruction report case configured.",
      severity: "info",
    },
    {
      model: "openarchiefbeheer.config.ArchiveConfig",
      field: "selectielijstklasse",
      code: "MISSING_SELECTIELIJSTKLASSE",
      message:
        "No selectielijstklasse for the destruction report case configured.",
      severity: "warning",
    },
  ],
};

export const HealthCheck: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: healthCheckSettingsLoader,
        action: settingsAction,
      },
    },
    mockData: [
      ...MOCK_BASE,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: administratorFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/health-check",
        method: "GET",
        status: 200,
        response: HEALTH_CHECK_FIXTURE,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const severityBadges =
      await canvas.findAllByLabelText(/error|warning|info/i);

    expect(severityBadges).toHaveLength(3);
    expect(severityBadges[0].parentElement).toHaveClass(
      "mykn-badge--variant-danger",
    );
    expect(severityBadges[1].parentElement).toHaveClass(
      "mykn-badge--variant-info",
    );
    expect(severityBadges[2].parentElement).toHaveClass(
      "mykn-badge--variant-warning",
    );
  },
};
