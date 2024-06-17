import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import { FIXTURE_DESTRUCTION_LIST } from "../../../fixtures/destructionList";
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
  reviewers: FIXTURE_USERS,
  destructionList: FIXTURE_DESTRUCTION_LIST,
  storageKey: "storybook-storage-key",
  zaken: FIXTURE_PAGINATED_ZAKEN,
  allZaken: FIXTURE_PAGINATED_ZAKEN,
  zaakSelection: {},
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
