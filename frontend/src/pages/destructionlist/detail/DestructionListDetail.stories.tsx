import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import { FIXTURE_PAGINATED_ZAKEN } from "../../../fixtures/paginatedZaken";
import { FIXTURE_USERS } from "../../../fixtures/users";
import { DestructionListDetailPage } from "./DestructionListDetail";
import { DestructionListDetailContext } from "./types";

const meta: Meta<typeof DestructionListDetailPage> = {
  title: "Pages/DestructionList/DestructionListDetailPage",
  component: DestructionListDetailPage,
  decorators: [ReactRouterDecorator],
  parameters: {
    mockData: [
      {
        url: "http://localhost:8080/api/v1/_zaaktypen-choices?",
        method: "GET",
        status: 200,
        response: [
          {
            label: "Melding klein kansspel",
            value:
              "https://test.openzaak.nl/catalogi/api/v1/zaaktypen/e95d9bdf-588d-4965-a469-378d9e0ca91e",
            extra: "MKK",
          },
        ],
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE: DestructionListDetailContext = {
  availableReviewers: FIXTURE_USERS,
  destructionList: {
    pk: 1,
    name: "My First Destruction List",
    author: FIXTURE_USERS[0],
    items: [
      FIXTURE_PAGINATED_ZAKEN.results[0],
      FIXTURE_PAGINATED_ZAKEN.results[1],
      FIXTURE_PAGINATED_ZAKEN.results[2],
    ].map((z, i) => ({
      zaak: z.url || "",
      status: "DEMO",
      zaakData: z,
    })),
    containsSensitiveInfo: false,
    status: "Pending",
    assignees: FIXTURE_USERS.map((u, i) => ({ user: u, order: i })),
    assignee: FIXTURE_USERS[0],
    created: "2024-07-11:16:57",
    statusChanged: "2024-07-11:16:57",
  },
  reviewers: FIXTURE_USERS,
  selectedZaken: [],
  uuid: "00000000-0000-0000-0000-000000000000",
  zaken: FIXTURE_PAGINATED_ZAKEN,
};

export const ReviewDestructionList: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE,
      },
    },
  },
};
