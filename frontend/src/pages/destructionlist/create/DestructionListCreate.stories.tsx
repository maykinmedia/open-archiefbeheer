import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import {
  assertCheckboxSelection,
  assertColumnSelection,
} from "../../../../.storybook/playFunctions";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { FIXTURE_SELECTIELIJSTKLASSE_CHOICES } from "../../../fixtures/selectieLijstKlasseChoices";
import {
  beoordelaarFactory,
  recordManagerFactory,
  usersFactory,
} from "../../../fixtures/user";
import { getZaakSelection } from "../../../lib/zaakSelection";
import {
  DESTRUCTION_LIST_CREATE_KEY,
  DestructionListCreatePage,
} from "./DestructionListCreate";
import { destructionListCreateAction } from "./DestructionListCreate.action";
import { DestructionListCreateContext } from "./DestructionListCreate.loader";

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
        response: {
          pk: 1,
          username: "johnDoe",
          firstName: "John",
          lastName: "Doe",
          email: "aaa@aaa.aaa",
          role: {
            canStartDestruction: true,
            canReviewDestruction: true,
            canReviewFinalList: false,
          },
        },
      },
      {
        url: "http://localhost:8000/api/v1/reviewers/?",
        method: "GET",
        status: 200,
        response: usersFactory(),
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE: DestructionListCreateContext = {
  reviewers: usersFactory(),
  paginatedZaken: paginatedZakenFactory(),
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

    const selectFirstReviewer = await within(modal).findByLabelText("Reviewer");
    await userEvent.click(selectFirstReviewer, { delay: 10 });

    const selectReviewerBeoordelaarOption = await within(modal).findAllByText(
      [beoordelaarFactory().firstName, beoordelaarFactory().lastName].join(" "),
    );
    await userEvent.click(selectReviewerBeoordelaarOption[0], {
      delay: 10,
    });
  },
};
