import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import {
  assertColumnSelection,
  clickButton,
  clickCheckbox,
} from "../../../../.storybook/playFunctions";
import { destructionListFactory } from "../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../fixtures/review";
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
        url: "http://localhost:8000/api/v1/_zaaktypen-choices/?destructionList=00000000-0000-0000-0000-000000000000",
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
  review: reviewFactory(),
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
  play: async (context) => {
    const { canvasElement } = context;
    await assertColumnSelection(context);
    await clickCheckbox(context);

    const canvas = within(canvasElement);

    // Get "Identificatie" checkbox in modal.
    const motivationInput = canvas.getByLabelText<HTMLInputElement>(
      "Reden van uitzondering",
    );

    // Type in the input field.
    await userEvent.type(motivationInput, "Uitzonderen", { delay: 10 });

    // Type in the input field.
    await clickButton({
      ...context,
      parameters: {
        name: "Uitzonderen",
      },
    });

    // Expect the motivationInput to be "Uitzonderen".
    expect(motivationInput.value).toBe("Uitzonderen");
  },
};
