import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../../../.storybook/decorators";
import {
  clickButton,
  fillButtonConfirmationForm,
} from "../../../../../../.storybook/playFunctions";
import { destructionListFactory } from "../../../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../../../fixtures/review";
import { reviewItemsFactory } from "../../../../../fixtures/reviewItem";
import {
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
  selectieLijstKlasseFactory,
} from "../../../../../fixtures/selectieLijstKlasseChoices";
import { usersFactory } from "../../../../../fixtures/user";
import {
  clearZaakSelection,
  getZaakSelection,
} from "../../../../../lib/zaakSelection";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { DestructionListProcessReviewPage } from "./DestructionListProcessReviewPage";

const meta: Meta<typeof DestructionListProcessReviewPage> = {
  title: "Pages/DestructionList/DestructionListProcessReviewPage",
  component: DestructionListProcessReviewPage,
  decorators: [ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        // loader:
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            FIXTURE_PROCESS_REVIEW.storageKey,
          );
          return { ...FIXTURE_PROCESS_REVIEW, zaakSelection };
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE_PROCESS_REVIEW: DestructionListDetailContext = {
  storageKey: `storybook-storage-key!${meta.title}:ProcessReview`,

  destructionList: { ...destructionListFactory(), status: "changes_requested" },
  destructionListItems: {
    count: reviewItemsFactory().length,
    next: null,
    previous: null,
    results: [],
  },

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  user: usersFactory()[0],

  review: reviewFactory(),
  reviewItems: reviewItemsFactory(),

  selectieLijstKlasseChoicesMap: FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
};

export const ProcessReview: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        action: async () => true,
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            `${FIXTURE_PROCESS_REVIEW.storageKey}`,
          );

          return { ...FIXTURE_PROCESS_REVIEW, zaakSelection };
        },
      },
    },
  },
  play: async (context) => {
    await fillButtonConfirmationForm({
      ...context,
      parameters: {
        elementIndex: 0,
        name: "Muteren",
        formValues: {
          "Aanpassen van selectielijstklasse": true,
          Selectielijstklasse: selectieLijstKlasseFactory()[0].label,
          Reden: "omdat het moet",
        },
      },
    });

    await fillButtonConfirmationForm({
      ...context,
      parameters: {
        elementIndex: 1,
        name: "Muteren",
        formValues: {
          "Aanpassen van selectielijstklasse": true,
          Selectielijstklasse: selectieLijstKlasseFactory()[1].label,
          Reden: "omdat het kan",
        },
      },
    });

    await fillButtonConfirmationForm({
      ...context,
      parameters: {
        elementIndex: 2,
        name: "Muteren",
        formValues: {
          "Aanpassen van selectielijstklasse": true,
          Selectielijstklasse: selectieLijstKlasseFactory()[2].label,
          Reden: "Waarom niet",
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await waitFor(async () => {
      fillButtonConfirmationForm({
        ...context,
        parameters: {
          name: "Opnieuw indienen",
          formValues: {
            Opmerking: "Kan gewoon",
          },
          submitForm: false,
        },
      });
    });
    // Clean up.
    await clearZaakSelection(`${FIXTURE_PROCESS_REVIEW.storageKey}`);
  },
};

export const CheckSelectielijstklasseSelection: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        action: async () => true,
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            `${FIXTURE_PROCESS_REVIEW.storageKey}`,
          );

          return { ...FIXTURE_PROCESS_REVIEW, zaakSelection };
        },
      },
    },
  },
  play: async (context) => {
    await clickButton({
      ...context,
      parameters: {
        name: "Muteren",
      },
    });

    const canvas = within(context.canvasElement);

    const modal = await canvas.findByRole("dialog");
    const option = await within(modal).findByLabelText(
      "Aanpassen van selectielijstklasse",
    );

    await userEvent.click(option, { delay: 10 });

    const dropdownSelectielijstklasse = await canvas.findByRole("combobox", {
      name: "Selectielijstklasse",
    });

    // we select a different selectielijstklasse
    await userEvent.click(dropdownSelectielijstklasse);
    await userEvent.click(
      canvas.getByText("1.5 - Afgebroken - vernietigen - P1Y"),
    );

    const archiefactiedatum =
      await canvas.findAllByLabelText("Archiefactiedatum");

    // FIXME: Remove?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const input = archiefactiedatum.find((input) => {
      return (
        input instanceof HTMLInputElement &&
        input.type === "text" &&
        input.offsetParent !== null
      );
    });
    // The dropdown shows the selectielijst klasse
    await waitFor(async () =>
      expect(dropdownSelectielijstklasse.childNodes[0].textContent).toEqual(
        "1.5 - Afgebroken - vernietigen - P1Y",
      ),
    );

    // we select a different selectielijstklasse
    await userEvent.click(dropdownSelectielijstklasse);
    await userEvent.click(
      canvas.getByText("1.1.1 - Ingericht - blijvend_bewaren"),
    );

    // We expect archiefactiedatum to be hidden now
    await waitFor(async () => expect(archiefactiedatum[0]).not.toBeVisible());

    // We do not expect the archiefactiedatum to be visible
    await waitFor(async () => expect(archiefactiedatum[0]).not.toBeVisible());

    await userEvent.keyboard("{Escape}");
  },
};
