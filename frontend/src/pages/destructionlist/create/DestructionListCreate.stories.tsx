import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import {
  assertCheckboxSelection,
  assertColumnSelection,
} from "../../../../.storybook/playFunctions";
import { FIXTURE_PAGINATED_ZAKEN } from "../../../fixtures/paginatedZaken";
import {
  FIXTURE_BEOORDELAAR,
  FIXTURE_PROCES_EIGENAAR,
  FIXTURE_RECORD_MANAGER,
  FIXTURE_USERS,
} from "../../../fixtures/user";
import {
  DestructionListCreateContext,
  DestructionListCreatePage,
} from "./DestructionListCreate";

const meta: Meta<typeof DestructionListCreatePage> = {
  title: "Pages/DestructionList/DestructionListCreatePage",
  component: DestructionListCreatePage,
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

const FIXTURE: DestructionListCreateContext = {
  reviewers: FIXTURE_USERS,
  zaken: FIXTURE_PAGINATED_ZAKEN,
  selectedZaken: [],
};

export const DestructionListCreatePageStory: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE,
      },
    },
  },
  play: async (context) => {
    await assertCheckboxSelection(context);
    await assertColumnSelection(context);
    await assertCheckboxSelection({
      ...context,
      parameters: { direction: "forwards" },
    });

    const canvas = within(context.canvasElement);
    const buttonCreate = await canvas.findByRole("button", {
      name: "Vernietigingslijst opstellen",
    });
    await userEvent.click(buttonCreate, { delay: 10 });

    const modal = await canvas.findByRole("dialog");
    const inputName = await within(modal).findByLabelText("Naam");
    await userEvent.type(
      inputName,
      [FIXTURE_RECORD_MANAGER.firstName, FIXTURE_RECORD_MANAGER.lastName].join(
        " ",
      ),
      { delay: 10 },
    );

    const selectFirstReviewer =
      await within(modal).findByLabelText("Eerste reviewer");
    await userEvent.click(selectFirstReviewer, { delay: 10 });

    const selectFirstReviewerBeoordelaarOption = await within(
      modal,
    ).findAllByText(
      [FIXTURE_BEOORDELAAR.firstName, FIXTURE_BEOORDELAAR.lastName].join(" "),
    );
    await userEvent.click(selectFirstReviewerBeoordelaarOption[0], {
      delay: 10,
    });

    const selectSecondReviewer =
      await within(modal).findByLabelText("Tweede reviewer");
    await userEvent.click(selectSecondReviewer, { delay: 10 });

    const selectSecondReviewerBeoordelaarOption = await within(
      modal,
    ).findAllByText(
      [
        FIXTURE_PROCES_EIGENAAR.firstName,
        FIXTURE_PROCES_EIGENAAR.lastName,
      ].join(" "),
    );
    await userEvent.click(selectSecondReviewerBeoordelaarOption[0], {
      delay: 10,
    });
  },
};
