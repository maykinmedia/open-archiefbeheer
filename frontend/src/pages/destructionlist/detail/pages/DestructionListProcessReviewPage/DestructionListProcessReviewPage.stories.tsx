import type { Meta, ReactRenderer, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PlayFunction } from "@storybook/types";

import { ReactRouterDecorator } from "../../../../../../.storybook/decorators";
import {
  clickButton,
  fillButtonConfirmationForm,
  fillForm,
} from "../../../../../../.storybook/playFunctions";
import { auditLogFactory } from "../../../../../fixtures/auditLog";
import { destructionListFactory } from "../../../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../../../fixtures/review";
import { reviewItemsFactory } from "../../../../../fixtures/reviewItem";
import {
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
  selectieLijstKlasseFactory,
} from "../../../../../fixtures/selectieLijstKlasseChoices";
import { userFactory, usersFactory } from "../../../../../fixtures/user";
import {
  clearZaakSelection,
  getZaakSelection,
} from "../../../../../lib/zaakSelection/zaakSelection";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { DestructionListProcessReviewPage } from "./DestructionListProcessReviewPage";

const meta: Meta<typeof DestructionListProcessReviewPage> = {
  title: "Pages/DestructionList/DestructionListProcessReviewPage",
  component: DestructionListProcessReviewPage,
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
        url: "http://localhost:8000/api/v1/_zaaktypen-choices/?inReview=1",
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
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/make_final",
        method: "POST",
        status: 200,
        response: [],
      },
      {
        url: "http://localhost:8000/api/v1/_selectielijstklasse-choices/?",
        method: "GET",
        status: 200,
        response: FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
      },
      {
        url: "http://localhost:8000/api/v1/_zaaktypen-choices/?inDestructionList=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
      },
      {
        url: "http://localhost:8000/api/v1/whoami/?",
        method: "GET",
        status: 200,
        response: userFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/reviewers/?",
        method: "GET",
        status: 200,
        response: usersFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/auditlog/?",
        method: "GET",
        status: 200,
        response: auditLogFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/review-responses/?review=1",
        method: "GET",
        status: 200,
        response: [],
      },
    ],
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

    await fillButtonConfirmationForm({
      ...context,
      parameters: {
        name: "Opnieuw indienen",
        formValues: {
          Opmerking: "Kan gewoon",
        },
        submitForm: false,
      },
    });

    const canvas = within(context.canvasElement);
    await userEvent.keyboard("{Escape}");

    const dialog = await canvas.findByRole("dialog");
    const close = await within(dialog).findByRole("button", {
      name: "Annuleren",
    });
    await userEvent.click(close, { delay: 300 });

    await waitFor(
      async () => {
        const mutateButtons = canvas.getAllByRole("button", {
          name: "Muteren",
        });
        await userEvent.click(mutateButtons[1], { delay: 10 });
        await canvas.findByRole("dialog");
      },
      { timeout: 10000 },
    );

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
