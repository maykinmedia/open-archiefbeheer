import type { Meta, ReactRenderer, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PlayFunction } from "@storybook/types";

import { ReactRouterDecorator } from "../../../../../../.storybook/decorators";
import { MOCK_ALL } from "../../../../../../.storybook/mockData";
import {
  assertColumnSelection,
  clickButton,
  fillForm,
} from "../../../../../../.storybook/playFunctions";
import { destructionListFactory } from "../../../../../fixtures/destructionList";
import {
  paginatedDestructionListItemsFactory,
  paginatedDestructionListItemsFailedFactory,
} from "../../../../../fixtures/destructionListItem";
import { paginatedZakenFactory } from "../../../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../../../fixtures/review";
import { reviewItemsFactory } from "../../../../../fixtures/reviewItem";
import { FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP } from "../../../../../fixtures/selectieLijstKlasseChoices";
import { usersFactory } from "../../../../../fixtures/user";
import { getZaakSelection } from "../../../../../lib/zaakSelection";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { DestructionListEditPage } from "./DestructionListEditPage";

const meta: Meta<typeof DestructionListEditPage> = {
  title: "Pages/DestructionList/DestructionListEditPage",
  component: DestructionListEditPage,
  decorators: [ReactRouterDecorator],
  parameters: {
    mockData: MOCK_ALL,
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        // loader:
        loader: async () => {
          const zaakSelection = await getZaakSelection(FIXTURE_EDIT.storageKey);
          return { ...FIXTURE_EDIT, zaakSelection };
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE_EDIT: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",

  destructionList: destructionListFactory({ status: "new" }),
  destructionListItems: paginatedDestructionListItemsFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  user: usersFactory()[0],

  review: null,
  reviewItems: null,

  selectieLijstKlasseChoicesMap: null,
};

export const EditDestructionList: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const editButton = await canvas.findByRole("button", {
      name: "Bewerken",
    });
    userEvent.click(editButton, { delay: 10 });
    // When the 'Annuleren' button is visible, then the "edit mode" is active
    const cancelButton = await canvas.findByRole("button", {
      name: "Annuleren",
    });

    await assertColumnSelection(context);

    userEvent.click(cancelButton, { delay: 10 });
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

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
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
          Opmerking: "Ready for destruction",
        },
      },
    });
  },
};

const FIXTURE_DELETE: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",

  destructionList: destructionListFactory({
    status: "ready_to_delete",
    processingStatus: "new",
  }),
  destructionListItems: paginatedDestructionListItemsFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
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
        name: /Vernietigen/,
        exact: false,
      },
    });
    const canvas = within(context.canvasElement);
    const submit = await canvas.findByText<HTMLButtonElement>(
      "zaken vernietigen",
      { exact: false },
    );
    const input = await canvas.getByLabelText(
      "Type naam van de lijst ter bevestiging",
    );
    expect(submit).toBeDisabled();
    await userEvent.click(input, {
      delay: 10,
    });
    userEvent.type(
      document.activeElement as HTMLInputElement,
      "My First Destruction List",
      {
        delay: 10,
      },
    );
    await waitFor(async () => {
      const isDisabled = submit.getAttribute("disabled");
      expect(isDisabled).toBe("");
    });
  },
};

const FIXTURE_FAILED_DELETE: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",

  destructionList: destructionListFactory({
    status: "ready_to_delete",
    processingStatus: "failed",
  }),
  destructionListItems: paginatedDestructionListItemsFailedFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  user: usersFactory()[0],

  review: null,
  reviewItems: null,

  selectieLijstKlasseChoicesMap: null,
};

export const DeleteFailedDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE_FAILED_DELETE,
      },
    },
  },
  play: DeleteDestructionList.play,
};

const FIXTURE_CANCEL_PLANNED_DESTRUCTION: DestructionListDetailContext = {
  storageKey: "storybook-storage-key",

  destructionList: destructionListFactory({
    status: "ready_to_delete",
    processingStatus: "new",
    plannedDestructionDate: "2026-01-01T00:00:00Z",
  }),
  destructionListItems: paginatedDestructionListItemsFactory(),

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  user: usersFactory()[0],

  review: null,
  reviewItems: null,

  selectieLijstKlasseChoicesMap: null,
};

export const CancelPlannedDestruction: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => FIXTURE_CANCEL_PLANNED_DESTRUCTION,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await clickButton({
      ...context,
      parameters: {
        ...context.parameters,
        name: "Vernietigen annuleren",
      },
    });
    const input = await canvas.findByLabelText("Opmerking");
    userEvent.type(input, "Test Comment", {
      delay: 10,
    });
  },
};
