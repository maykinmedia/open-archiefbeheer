import type { Meta, StoryObj } from "@storybook/react";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import { assertColumnSelection } from "../../../../.storybook/playFunctions";
import { destructionListFactory } from "../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { usersFactory } from "../../../fixtures/user";
import { DestructionListReviewPage } from "./DestructionListReview";
import { DestructionListReviewContext } from "./DestructionListReview.loader";

const meta: Meta<typeof DestructionListReviewPage> = {
  title: "Pages/DestructionList/DestructionListReviewPage",
  component: DestructionListReviewPage,
  decorators: [ReactRouterDecorator],
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/_zaaktypen-choices?",
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

const FIXTURE: DestructionListReviewContext = {
  reviewers: usersFactory(),
  zaken: paginatedZakenFactory(),
  selectedZaken: [],
  uuid: "00000000-0000-0000-0000-000000000000",
  destructionList: destructionListFactory(),
};

export const ReviewDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE,
      },
    },
  },
  play: assertColumnSelection,
};
