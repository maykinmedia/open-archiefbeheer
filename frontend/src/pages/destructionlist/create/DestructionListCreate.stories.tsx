import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import {
  assertCheckboxSelection,
  assertColumnSelection,
} from "../../../../.storybook/playFunctions";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import {
  beoordelaarFactory,
  procesEigenaarFactory,
  recordManagerFactory,
  usersFactory,
} from "../../../fixtures/user";
import { getZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import {
  DESTRUCTION_LIST_CREATE_KEY,
  DestructionListCreateContext,
  DestructionListCreatePage,
} from "./DestructionListCreate";
import { destructionListCreateAction } from "./DestructionListCreate.action";

const meta: Meta<typeof DestructionListCreatePage> = {
  title: "Pages/DestructionList/DestructionListCreatePage",
  component: DestructionListCreatePage,
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

const FIXTURE: DestructionListCreateContext = {
  reviewers: usersFactory(),
  zaken: paginatedZakenFactory(),
  zaakSelection: {
    ["http://localhost:8000/zaken/api/v1/zaken/00000000-0000-0000-0000-000000000000"]:
      { selected: true },
  },
  allZakenSelected: false,
};

export const DestructionListCreatePageStory: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => ({
          ...FIXTURE,
          zaakSelection: await getZaakSelection(DESTRUCTION_LIST_CREATE_KEY),
        }),
        action: destructionListCreateAction,
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
    const buttonsCreate = await canvas.findAllByRole("button", {
      name: "Vernietigingslijst opstellen",
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [navigationCreate, actionCreate] = buttonsCreate;
    await userEvent.click(actionCreate, { delay: 10 });

    const modal = await canvas.findByRole("dialog");
    const inputName = await within(modal).findByLabelText("Naam");
    await userEvent.type(
      inputName,
      [recordManagerFactory().firstName, recordManagerFactory().lastName].join(
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
      [beoordelaarFactory().firstName, beoordelaarFactory().lastName].join(" "),
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
        procesEigenaarFactory().firstName,
        procesEigenaarFactory().lastName,
      ].join(" "),
    );
    await userEvent.click(selectSecondReviewerBeoordelaarOption[0], {
      delay: 10,
    });
  },
};
