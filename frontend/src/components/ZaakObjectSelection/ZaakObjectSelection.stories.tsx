import { Body, Modal } from "@maykin-ui/admin-ui";
import { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ModalServiceDecorator } from "../../../.storybook/decorators";
import {
  FIXTURE_DESTRUCTION_LIST_ITEM,
  zaakObjectSelectionItemsFactory,
} from "../../fixtures";
import { ZaakObjectSelectionItemMutation } from "../../lib/api/zaakObjectSelection";
import { ZaakObject } from "../../types";
import { ZaakObjectSelection as ZaakObjectSelectionComponent } from "./ZaakObjectSelection";

const meta: Meta<typeof ZaakObjectSelectionComponent> = {
  title: "Components/ZaakObjectSelection",
  component: ZaakObjectSelectionComponent,
  decorators: [ModalServiceDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dynamic mock objects, get updated by PATCH mock, resulting in updated GET mock.
 */
const MOCK_STATE = zaakObjectSelectionItemsFactory([
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
]);

export const HappyFlow: Story = {
  args: {
    destructionListItemPk: FIXTURE_DESTRUCTION_LIST_ITEM.pk,
  },
  parameters: {
    mockData: [
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/zaakobjects`,
        method: "GET",
        status: 200,
        response: MOCK_STATE,
      },
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/zaakobjects`,
        method: "PATCH",
        status: 200,
        //
        response: (request: Request) => {
          const mutations: ZaakObjectSelectionItemMutation[] = JSON.parse(
            request.body as unknown as string,
          );
          const urlsToUpdate = new Set(mutations.map((m) => m.url));

          for (const item of MOCK_STATE) {
            if (!urlsToUpdate.has(item.url)) continue;
            item.selected =
              mutations.find((m) => m.url === item.url)?.selected ?? false;
          }

          return request.body;
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    // Check initial state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde zaakobjecten (1/2)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 1");
    await within(canvasElement).findAllByLabelText("Zaakobject 2");
    await within(canvasElement).findAllByLabelText(
      "Niet-ondersteunde zaakobjecten (1)",
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
      "Ondersteunde zaakobjecten (2/2)",
    );

    // Click second checkbox.
    await userEvent.click(checkboxes[1]);

    // Save changes (1 selected object).
    await userEvent.click(submit);

    // Check final state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde zaakobjecten (1/2)",
    );
  },
};

export const ErrorWhileFetchingSelection: Story = {
  args: {
    destructionListItemPk: FIXTURE_DESTRUCTION_LIST_ITEM.pk,
  },
  parameters: {
    mockData: [
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/zaakobjects`,
        method: "GET",
        status: 500,
        response: {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
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
    destructionListItemPk: FIXTURE_DESTRUCTION_LIST_ITEM.pk,
  },
  parameters: {
    mockData: [
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/zaakobjects`,
        method: "GET",
        status: 200,
        response: MOCK_STATE,
      },
      {
        url: `http://localhost:8000/api/v1/destruction-list-items/${FIXTURE_DESTRUCTION_LIST_ITEM.pk}/zaakobjects`,
        method: "PATCH",
        status: 500,
        response: {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    // Check initial state.
    await within(canvasElement).findAllByLabelText(
      "Ondersteunde zaakobjecten (1/2)",
    );
    await within(canvasElement).findAllByLabelText("Zaakobject 1");
    await within(canvasElement).findAllByLabelText("Zaakobject 2");
    await within(canvasElement).findAllByLabelText(
      "Niet-ondersteunde zaakobjecten (1)",
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

export const InModal: Story = {
  ...HappyFlow,
  render: (args) => (
    <Modal title="Zaakobjecten" open>
      <Body>
        <ZaakObjectSelectionComponent {...args} />
      </Body>
    </Modal>
  ),
};
