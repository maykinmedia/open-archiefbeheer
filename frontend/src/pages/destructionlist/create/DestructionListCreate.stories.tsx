import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

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
import { getZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
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
            name: "Admin",
            canStartDestruction: true,
            canReviewDestruction: true,
            canReviewFinalList: false,
            canViewCaseDetails: true,
          },
        },
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

export const DestructionListSelectielijstklasseStory: Story = {
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
    const canvas = within(context.canvasElement);

    // Get "Select columns" button.
    const selectColumnsButton = await canvas.findByRole<HTMLButtonElement>(
      "button",
      {
        name: "Select columns",
      },
    );

    await userEvent.click(selectColumnsButton, { delay: 100 });
    const modal = await canvas.findByRole("dialog");

    // Get "Selectielijstklasse" checkbox in modal.
    const selectielijstklasseCheckbox = within(
      modal,
    ).getByLabelText<HTMLInputElement>("Selectielijstklasse");
    const saveColumnSelection = await within(
      modal,
    ).findByRole<HTMLButtonElement>("button", {
      name: "Save column selection",
    });

    // Normalize state.
    if (!selectielijstklasseCheckbox.checked) {
      await userEvent.click(selectielijstklasseCheckbox);
      await userEvent.click(saveColumnSelection);
      await userEvent.click(selectColumnsButton);
    }

    await userEvent.click(saveColumnSelection, { delay: 100 });

    // Assert that selectielijstklas is visible
    const zaken1 = await canvas.findAllByText(
      "1.1.3 - Ingericht - vernietigen - P10Y",
    );
    await expect(zaken1.length).toEqual(3);

    const zaken2 = await canvas.findAllByText(
      "1.1 - Ingericht - vernietigen - P10Y",
    );
    await expect(zaken2.length).toEqual(2);

    const zaken3 = await canvas.findAllByText(
      "1.5 - Afgebroken - vernietigen - P1Y",
    );
    await expect(zaken3.length).toEqual(4);
  },
};
