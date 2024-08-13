import type { Meta, ReactRenderer, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PlayFunction } from "@storybook/types";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import {
  assertCheckboxSelection,
  assertColumnSelection,
  clickButton,
  fillButtonConfirmationForm,
  fillCheckboxConfirmationForm,
  fillForm,
} from "../../../../.storybook/playFunctions";
import { auditLogFactory } from "../../../fixtures/auditLog";
import { destructionListFactory } from "../../../fixtures/destructionList";
import { paginatedDestructionListItemsFactory } from "../../../fixtures/destructionListItem";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../fixtures/review";
import { reviewItemsFactory } from "../../../fixtures/reviewItem";
import {
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
  selectieLijstKlasseFactory,
} from "../../../fixtures/selectieLijstKlasseChoices";
import { usersFactory } from "../../../fixtures/user";
import {
  clearZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { DestructionListDetailPage } from "./DestructionListDetail";
import { DestructionListDetailContext } from "./DestructionListDetail.loader";

const meta: Meta<typeof DestructionListDetailPage> = {
  title: "Pages/DestructionList/DestructionListDetailPage",
  component: DestructionListDetailPage,
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
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/make_final",
        method: "POST",
        status: 200,
        response: [],
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const assertReassignDestructionList: PlayFunction<ReactRenderer> = async (
  context,
) => {
  await clickButton({
    ...context,
    parameters: {
      name: 'Edit "Beoordelaar 1"',
    },
  });

  await clickButton({
    ...context,
    parameters: {
      name: 'Edit "Beoordelaar 2"',
    },
  });

  let form;
  await waitFor(() => {
    form = document.forms[0];
    if (!form) {
      throw new Error();
    }
  });

  await fillForm({
    ...context,
    parameters: {
      form,
      formValues: {
        "Beoordelaar 1": "Proces ei Genaar (Proces ei Genaar)",
        "Beoordelaar 2": "Beoor del Laar (Beoor del Laar)",
      },
      submitForm: false,
    },
  });

  await fillButtonConfirmationForm({
    ...context,
    parameters: {
      formValues: {
        Reden: "omdat het kan",
      },
      name: "Toewijzen",
      submitForm: false,
    },
  });

  const dialog = await within(
    context.canvasElement,
  ).findByRole<HTMLDialogElement>("dialog");
  const close = await within(dialog).findByRole("button", {
    name: "Close",
  });

  await userEvent.click(close, { delay: 300 });
};

const FIXTURE_EDIT: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",

  destructionList: destructionListFactory(),
  destructionListItems: paginatedDestructionListItemsFactory(),
  logItems: auditLogFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  reviewers: usersFactory(),
  user: usersFactory()[0],

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
    await assertReassignDestructionList(context);

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
  storageKey: `storybook-storage-key!${meta.title}:ProcessReview`,

  destructionList: { ...destructionListFactory(), status: "changes_requested" },
  destructionListItems: {
    count: reviewItemsFactory().length,
    next: null,
    previous: null,
    results: [],
  },
  logItems: auditLogFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  reviewers: usersFactory(),
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
    await assertReassignDestructionList(context);

    await fillCheckboxConfirmationForm({
      ...context,
      parameters: {
        elementIndex: 0,
        formValues: {
          "Aanpassen van selectielijstklasse": true,
          Selectielijstklasse: selectieLijstKlasseFactory()[0].label,
          Reden: "omdat het moet",
        },
      },
    });

    await fillCheckboxConfirmationForm({
      ...context,
      parameters: {
        elementIndex: 1,
        formValues: {
          "Aanpassen van selectielijstklasse": true,
          Selectielijstklasse: selectieLijstKlasseFactory()[1].label,
          Reden: "omdat het kan",
        },
      },
    });

    await fillCheckboxConfirmationForm({
      ...context,
      parameters: {
        elementIndex: 2,
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
    const close = await within(dialog).findByRole("button", { name: "Close" });
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

const FIXTURE_FINAL_DESTRUCTION: DestructionListDetailContext = {
  storageKey: `storybook-storage-key!${meta.title}:FinalDestruction`,

  destructionList: {
    ...destructionListFactory(),
    status: "internally_reviewed",
  },
  destructionListItems: {
    count: reviewItemsFactory().length,
    next: null,
    previous: null,
    results: [],
  },
  logItems: auditLogFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  reviewers: usersFactory(),
  user: usersFactory()[0],

  review: reviewFactory(),
  reviewItems: reviewItemsFactory(),

  selectieLijstKlasseChoicesMap: FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
};

const fillMarkListAsFinalForm: PlayFunction<ReactRenderer> = async (
  context,
) => {
  const canvas = within(context.canvasElement);
  const buttons = await canvas.findAllByRole("button");
  const markListAsFinalButton = buttons.find((button) => {
    return button.textContent === "Markeren als definitief";
  });

  if (!markListAsFinalButton) {
    throw new Error("Markeren als definitief knop niet gevonden.");
  }
  await userEvent.click(markListAsFinalButton, { delay: 100 });

  const modal = await canvas.findByRole("dialog");
  const form = await within(modal).findByRole("form");
  await fillForm({
    ...context,
    parameters: {
      ...context.parameters,
      form,
    },
  });
};

export const MarkDestructionListAsFinal: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        action: async () => true,
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            `${FIXTURE_FINAL_DESTRUCTION.storageKey}`,
          );

          return { ...FIXTURE_FINAL_DESTRUCTION, zaakSelection };
        },
      },
    },
  },
  play: async (context) => {
    fillMarkListAsFinalForm({
      ...context,
      parameters: {
        elementIndex: 0,
        formValues: {
          Archivaris: "Record Manager",
        },
      },
    });
  },
};

const FIXTURE_DELETE: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",

  destructionList: destructionListFactory({ status: "ready_to_delete" }),
  destructionListItems: paginatedDestructionListItemsFactory(),
  logItems: auditLogFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  reviewers: usersFactory(),
  user: usersFactory()[0],

  review: null,
  reviewItems: null,

  selectieLijstKlasseChoicesMap: null,
};

export const DeleteDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE_DELETE,
      },
    },
  },
  play: async (context) => {
    await clickButton({
      ...context,
      parameters: {
        ...context.parameters,
        name: "Vernietigen starten",
      },
    });
    const canvas = within(context.canvasElement);
    const submit = await canvas.findByText<HTMLButtonElement>(
      "10 zaken vernietigen",
    );
    expect(submit).toBeDisabled();
    userEvent.type(
      document.activeElement as HTMLInputElement,
      "My First Destruction List",
      {
        delay: 10,
      },
    );
    await waitFor(async () => await expect(submit).not.toBeDisabled());
  },
};
