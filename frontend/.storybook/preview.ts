import "@maykin-ui/admin-ui/style";
import type { Preview } from "@storybook/react";

import { auditLogFactory } from "../src/fixtures/auditLog";
import {
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
} from "../src/fixtures/selectieLijstKlasseChoices";
import { userFactory, usersFactory } from "../src/fixtures/user";
import { FIXTURE_ZAAKTYPE_CHOICES } from "../src/fixtures/zaaktypeChoices";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    mockAddonConfigs: {
      globalMockData: [],
      ignoreQueryParams: true
    },
    mockData: [
      {
        url: "http://localhost:8000/api/v1/_zaaktypen-choices?",
        method: "GET",
        status: 200,
        response: FIXTURE_ZAAKTYPE_CHOICES
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/make_final",
        method: "POST",
        status: 200,
        response: [],
      },
      {
        url: "http://localhost:8000/api/v1/_selectielijstklasse-choices/?",
        method: "GET",
        status: 200,
        response: FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
      },
      {
        url: "http://localhost:8000/api/v1/whoami/?",
        method: "GET",
        status: 200,
        response: userFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/reviewers/?",
        method: "GET",
        status: 200,
        response: usersFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/auditlog/?",
        method: "GET",
        status: 200,
        response: auditLogFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/oidc-info?",
        method: "GET",
        status: 200,
        response: {
          enabled: false,
          loginUrl: "",
        },
      },
      {
        url: "http://localhost:8000/api/v1/review-responses/?review=1",
        method: "GET",
        status: 200,
        response: [],
      },
    ]
  },
};

export default preview;
