import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import {
  assertCheckboxSelection,
  assertColumnSelection,
} from "../../../../.storybook/playFunctions";
import { FIXTURE_DESTRUCTION_LIST } from "../../../fixtures/destructionList";
import { FIXTURE_PAGINATED_ZAKEN } from "../../../fixtures/paginatedZaken";
import { FIXTURE_REVIEW } from "../../../fixtures/review";
import { FIXTURE_REVIEW_ITEMS } from "../../../fixtures/reviewItem";
import {
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
} from "../../../fixtures/selectieLijstKlasseChoices";
import { FIXTURE_USERS } from "../../../fixtures/user";
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

const FIXTURE_EDIT: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",
  destructionList: FIXTURE_DESTRUCTION_LIST,
  reviewers: FIXTURE_USERS,
  zaken: FIXTURE_PAGINATED_ZAKEN,
  selectableZaken: FIXTURE_PAGINATED_ZAKEN,
  zaakSelection: {},
  review: null,
  reviewItems: null,
  selectieLijstKlasseChoicesMap: null,
};

export const EditDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE_EDIT,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const editButton = await canvas.findByRole("button", { name: "Bewerken" });
    userEvent.click(editButton, { delay: 10 });

    await assertCheckboxSelection(context);
    await assertColumnSelection(context);

    const cancelButton = await canvas.findByRole("button", {
      name: "Annuleren",
    });
    userEvent.click(cancelButton, { delay: 10 });

    await assertColumnSelection(context);
  },
};

const FIXTURE_PROCESS_REVIEW: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",
  destructionList: { ...FIXTURE_DESTRUCTION_LIST, status: "changes_requested" },
  reviewers: FIXTURE_USERS,
  zaken: FIXTURE_PAGINATED_ZAKEN,
  selectableZaken: FIXTURE_PAGINATED_ZAKEN,
  zaakSelection: {},
  review: FIXTURE_REVIEW,
  reviewItems: FIXTURE_REVIEW_ITEMS,
  selectieLijstKlasseChoicesMap: FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
};

export const ProcessReview: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE_PROCESS_REVIEW,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const checkbox = await canvas.findAllByRole("checkbox");
    await userEvent.click(checkbox[0], { delay: 10 });
    const modal = await canvas.findByRole("dialog");

    const checkboxActie = await within(modal).findByLabelText(
      "Aanpassen van selectielijstklasse",
    );
    await userEvent.click(checkboxActie, { delay: 10 });

    const selectSelectielijstKlasse = await within(modal).findByLabelText(
      "Selectielijstklasse",
    );
    await userEvent.click(selectSelectielijstKlasse, { delay: 10 });

    const selectSelectielijstKlasseOption = await within(modal).findAllByText(
      FIXTURE_SELECTIELIJSTKLASSE_CHOICES[0].label,
    );
    await userEvent.click(selectSelectielijstKlasseOption[0], {
      delay: 10,
    });

    const inputReden = await within(modal).findByLabelText("Reden");
    await userEvent.type(inputReden, "Omdat het moet", { delay: 10 });
    await userEvent.tab();
  },
};
