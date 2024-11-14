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
      {
        url: "http://localhost:8000/api/v1/selections/storybook-storage-key?",
        method: "PATCH",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/selections/storybook-storage-key/select-all?",
        method: "GET",
        status: 200,
        response: {
          allSelected: false,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/storybook-storage-key/count?",
        method: "GET",
        status: 200,
        response: {
          count: 0,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-changes_requested/count?",
        method: "GET",
        status: 200,
        response: {
          count: 0,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-changes_requested/select-all?",
        method: "GET",
        status: 200,
        response: {
          allSelected: false,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-changes_requested/?items=http%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F87691e74-1b0b-491a-aa63-0a396bbb1e3e%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F3038cc8e-003b-411c-b6ef-7dc5ddc5a3ee%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F78b6dd10-261b-4a40-99e2-1eea3e38bc99%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F64bec25d-5752-48a9-b2f9-6c27085a469f%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F409a291a-9cf0-4c40-9f31-25e9452a8e79%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F1188687c-392b-439e-9d5f-4d17bac822bf%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F5d816422-7f1c-42b4-9a4c-715d2e07aca3%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2e803c71-49c4-4dc0-bfd1-42f2a3da99f9%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2Fbd6cdd85-d578-47fa-9ddb-846354088a47%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2ca5f28c-397b-4cc6-ac76-4ef6cab19f59",
        method: "GET",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/selections/storybook-storage-key/?items=http%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F87691e74-1b0b-491a-aa63-0a396bbb1e3e%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F3038cc8e-003b-411c-b6ef-7dc5ddc5a3ee%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F78b6dd10-261b-4a40-99e2-1eea3e38bc99%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F64bec25d-5752-48a9-b2f9-6c27085a469f%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F409a291a-9cf0-4c40-9f31-25e9452a8e79%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F1188687c-392b-439e-9d5f-4d17bac822bf%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F5d816422-7f1c-42b4-9a4c-715d2e07aca3%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2e803c71-49c4-4dc0-bfd1-42f2a3da99f9%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2Fbd6cdd85-d578-47fa-9ddb-846354088a47%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2ca5f28c-397b-4cc6-ac76-4ef6cab19f59",
        method: "GET",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/selections/storybook-storage-key/?items=http%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F87691e74-1b0b-491a-aa63-0a396bbb1e3e%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F3038cc8e-003b-411c-b6ef-7dc5ddc5a3ee%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F78b6dd10-261b-4a40-99e2-1eea3e38bc99%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F64bec25d-5752-48a9-b2f9-6c27085a469f%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F409a291a-9cf0-4c40-9f31-25e9452a8e79%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F1188687c-392b-439e-9d5f-4d17bac822bf%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F5d816422-7f1c-42b4-9a4c-715d2e07aca3%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2e803c71-49c4-4dc0-bfd1-42f2a3da99f9%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2Fbd6cdd85-d578-47fa-9ddb-846354088a47%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2ca5f28c-397b-4cc6-ac76-4ef6cab19f59&selected=true",
        method: "GET",
        status: 200,
        response: {},
      }
    ]
  },
};

export default preview;
