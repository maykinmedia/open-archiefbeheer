import { delay } from "@maykin-ui/client-common";
import { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ModalServiceDecorator } from "../../../.storybook/decorators";
import {
  FIXTURE_DESTRUCTION_LIST_ITEM,
  beoordelaarFactory,
  destructionListFactory,
  destructionListItemFactory,
  recordManagerFactory,
  relatedObjectsSelectionItemsFactory,
} from "../../fixtures";
import { RelatedObjectsSelectionItemMutation } from "../../lib/api/relatedObjectsSelection";
import { ZaakObject } from "../../types";
import { RelatedObjectsSelection as RelatedObjectsSelectionComponent } from "./RelatedObjectsSelection";
import { RelatedObjectsSelectionModal as RelatedObjectsSelectionModalComponent } from "./RelatedObjectsSelectionModal";

const meta: Meta<typeof RelatedObjectsSelectionComponent> = {
  title: "Components/RelatedObjectsSelection",
  component: RelatedObjectsSelectionComponent,
  decorators: [ModalServiceDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dynamic mock objects, get updated by PATCH mock, resulting in updated GET mock.
 */
const INITIAL_MOCK_STATE = Object.freeze(
  relatedObjectsSelectionItemsFactory([
    {
      url: "https://openzaak.test.maykin.opengem.nl/zaken/api/v1/zaakobjecten/00000000-0000-0000-0000-000000000000",
      selected: true,
      supported: true,
      result: {
        relatieomschrijving: "Zaakobject 1",
      } as ZaakObject,
    },
    {
      url: "https://openzaak.test.maykin.opengem.nl/zaken/api/v1/zaakobjecten/11111111-1111-1111-1111-111111111111",
      selected: false,
      supported: true,
      result: {
        relatieomschrijving: "Zaakobject 2",
      } as ZaakObject,
    },
    {
      url: "https://openzaak.test.maykin.opengem.nl/zaken/api/v1/zaakobjecten/22222222-2222-2222-2222-222222222222",
      selected: false,
      supported: false,
      result: {
        relatieomschrijving: "Zaakobject 3",
      } as ZaakObject,
    },
  ]),
);

let MOCK_STATE = INITIAL_MOCK_STATE;

export const HappyFlow: Story = {
  args: {
    destructionList: destructionListFactory(),
    destructionListItemPk: destructionListItemFactory().pk,
    user: recordManagerFactory(),
  },
  parameters: {
    mockData: [
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/related-objects-selection/`,
        method: "GET",
        status: 200,
        response: MOCK_STATE,
      },
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/related-objects-selection/`,
        method: "PATCH",
        status: 200,
        response: (request: Request) => {
          const mutations: RelatedObjectsSelectionItemMutation[] = JSON.parse(
            request.body as unknown as string,
          );
          const urlsToUpdate = new Set(mutations.map((m) => m.url));

          for (const item of MOCK_STATE) {
            if (!urlsToUpdate.has(item.url)) continue;
            item.selected =
              mutations.find((m) => m.url === item.url)?.selected ?? false;
          }
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    MOCK_STATE = INITIAL_MOCK_STATE;

    // Check initial state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde objecten (1/2)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 1");
    await within(canvasElement).findAllByLabelText("Zaakobject 2");
    await within(canvasElement).findAllByLabelText(
      "Niet-ondersteunde objecten (1)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 3");

    // Get checkboxes.
    const checkboxes =
      await within(canvasElement).findAllByRole<HTMLInputElement>("checkbox");

    // Get submit button.
    const submit = await within(canvasElement).findByRole<HTMLButtonElement>(
      "button",
      { name: "Opslaan" },
    );

    // Select all checkboxes
    for (const checkbox of checkboxes) {
      if (checkbox.disabled || checkbox.checked) continue;
      await userEvent.click(checkbox);
    }

    // Save changes (2 selected objects).
    await userEvent.click(submit);

    // Check updated state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde objecten (2/2)",
    );

    // Click second checkbox.
    await userEvent.click(checkboxes[1]);

    // Save changes (1 selected object).
    await userEvent.click(submit);

    // Check final state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde objecten (1/2)",
    );
  },
};

export const ReadOnly: Story = {
  ...HappyFlow,
  args: {
    ...HappyFlow.args,
    user: beoordelaarFactory(),
  },
  play: async ({ canvasElement }) => {
    MOCK_STATE = INITIAL_MOCK_STATE;

    // Check initial state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde objecten (1/2)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 1");
    await within(canvasElement).findAllByLabelText("Zaakobject 2");
    await within(canvasElement).findAllByLabelText(
      "Niet-ondersteunde objecten (1)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 3");

    // Get checkboxes.
    const checkboxes =
      await within(canvasElement).findAllByRole<HTMLInputElement>("checkbox");

    for (const checkbox of checkboxes) {
      expect(checkbox).toBeDisabled();
    }
  },
};

export const ErrorWhileFetchingSelection: Story = {
  args: {
    destructionList: destructionListFactory(),
    destructionListItemPk: destructionListItemFactory().pk,
    user: recordManagerFactory(),
  },
  parameters: {
    mockData: [
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/related-objects-selection/`,
        method: "GET",
        status: 500,
        response: {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    MOCK_STATE = INITIAL_MOCK_STATE;

    // Check error message.
    await waitFor(async () =>
      expect(
        within(canvasElement).getByText(
          "Er is een fout opgetreden bij het ophalen van gerelateerde objecten!",
        ),
      ).toBeVisible(),
    );
  },
};

export const ErrorWhileSubmittingData: Story = {
  args: {
    destructionList: destructionListFactory(),
    destructionListItemPk: destructionListItemFactory().pk,
    user: recordManagerFactory(),
  },
  parameters: {
    mockData: [
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/related-objects-selection/`,
        method: "GET",
        status: 200,
        response: MOCK_STATE,
      },
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/related-objects-selection/`,
        method: "PATCH",
        status: 500,
        response: {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    MOCK_STATE = INITIAL_MOCK_STATE;

    // Check initial state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde objecten (1/2)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 1");
    await within(canvasElement).findAllByLabelText("Zaakobject 2");
    await within(canvasElement).findAllByLabelText(
      "Niet-ondersteunde objecten (1)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 3");

    // Get checkboxes.
    const checkboxes =
      await within(canvasElement).findAllByRole<HTMLInputElement>("checkbox");

    // Get submit button.
    const submit = await within(canvasElement).findByRole<HTMLButtonElement>(
      "button",
      { name: "Opslaan" },
    );

    // Select all checkboxes
    for (const checkbox of checkboxes) {
      if (checkbox.disabled || checkbox.checked) continue;
      await userEvent.click(checkbox);
    }

    // Save changes (should fail).
    await userEvent.click(submit);

    // Check error message.
    await waitFor(async () =>
      expect(
        within(canvasElement).getByText(
          "Er is een fout opgetreden bij het selecteren van gerelateerde objecten!",
        ),
      ).toBeVisible(),
    );
  },
};

export const RelatedObjectsSelectionModal: Story = {
  ...HappyFlow,
  render(args) {
    return <RelatedObjectsSelectionModalComponent amount={3} {...args} />;
  },
  play: async (ctx) => {
    MOCK_STATE = INITIAL_MOCK_STATE;

    // Check initial state.
    const button = await within(ctx.canvasElement).findByText("3");
    await userEvent.click(button);
    await delay(300);
    HappyFlow.play?.(ctx);
  },
};
