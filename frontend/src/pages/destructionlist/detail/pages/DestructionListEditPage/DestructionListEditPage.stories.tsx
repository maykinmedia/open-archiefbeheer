import type { Meta, StoryObj } from "@storybook/react";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../../../.storybook/decorators";
import {
  clickButton,
  clickCheckbox,
  fillForm,
} from "../../../../../../.storybook/playFunctions";
import { destructionListFactory } from "../../../../../fixtures/destructionList";
import { paginatedDestructionListItemsFactory } from "../../../../../fixtures/destructionListItem";
import { paginatedZakenFactory } from "../../../../../fixtures/paginatedZaken";
import { usersFactory } from "../../../../../fixtures/user";
import { getZaakSelection } from "../../../../../lib/zaakSelection";
import { destructionListUpdateAction } from "../../DestructionListDetail.action";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { DestructionListEditPage } from "./DestructionListEditPage";

const meta: Meta<typeof DestructionListEditPage> = {
  title: "Pages/DestructionList/DestructionListEditPage",
  component: DestructionListEditPage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE_BASE: DestructionListDetailContext = {
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

const FIXTURE_EDIT = { ...FIXTURE_BASE };

export const EditDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        loader: async () => {
          const zaakSelection = await getZaakSelection(FIXTURE_EDIT.storageKey);
          return { ...FIXTURE_EDIT, zaakSelection };
        },
        action: destructionListUpdateAction,
      },
    },
  },
  play: async (context) => {
    await clickButton({
      ...context,
      parameters: { clickButton: { name: "Bewerken" } },
    });
    await clickCheckbox({
      ...context,
      parameters: { clickCheckbox: { elementIndex: 2 } },
    });
    await clickButton({
      ...context,
      parameters: { clickButton: { name: "Vernietigingslijst aanpassen" } },
    });
  },
};

const FIXTURE_FINAL_DESTRUCTION: DestructionListDetailContext = {
  ...FIXTURE_BASE,
  destructionList: {
    ...FIXTURE_BASE.destructionList,
    status: "internally_reviewed",
  },
};

export const MarkDestructionListAsFinal: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            FIXTURE_FINAL_DESTRUCTION.storageKey,
          );
          return { ...FIXTURE_FINAL_DESTRUCTION, zaakSelection };
        },
        action: destructionListUpdateAction,
      },
    },
    clickButton: { name: "Markeren als definitief" },
    fillForm: {
      formValues: {
        Archivaris: "Proces ei Genaar (Proces ei Genaar)",
        Opmerking: "MarkDestructionListAsFinal",
      },
    },
  },
  play: async (context) => {
    await clickButton(context);
    await fillForm(context);
  },
};

const FIXTURE_DELETE: DestructionListDetailContext = {
  ...FIXTURE_BASE,
  destructionList: {
    ...FIXTURE_BASE.destructionList,
    status: "ready_to_delete",
    processingStatus: "new",
  },
};

export const DeleteDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            FIXTURE_DELETE.storageKey,
          );
          return { ...FIXTURE_DELETE, zaakSelection };
        },
        action: destructionListUpdateAction,
      },
    },
    clickButton: { name: "Vernietigen starten" },
    fillForm: {
      formValues: {
        "Type naam van de lijst ter bevestiging": "My first destruction list",
      },
    },
  },
  play: async (context) => {
    await clickButton(context);
    await fillForm(context);
  },
};

const FIXTURE_FAILED_DELETE: DestructionListDetailContext = {
  ...FIXTURE_DELETE,
  destructionList: {
    ...FIXTURE_DELETE.destructionList,
    processingStatus: "failed",
  },
};

export const DeleteFailedDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            FIXTURE_FAILED_DELETE.storageKey,
          );
          return { ...FIXTURE_FAILED_DELETE, zaakSelection };
        },
        action: destructionListUpdateAction,
      },
    },
    clickButton: { name: "Vernietigen herstarten" },
    fillForm: {
      formValues: {
        "Type naam van de lijst ter bevestiging": "My first destruction list",
      },
    },
  },
  play: DeleteDestructionList.play,
};

const FIXTURE_PLANNED_DELETE: DestructionListDetailContext = {
  ...FIXTURE_DELETE,
  destructionList: {
    ...FIXTURE_DELETE.destructionList,
    status: "ready_to_delete",
    processingStatus: "queued",
    plannedDestructionDate: "2026-01-01T00:00:00Z",
  },
};

export const CancelPlannedDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            FIXTURE_PLANNED_DELETE.storageKey,
          );
          return { ...FIXTURE_PLANNED_DELETE, zaakSelection };
        },
        action: destructionListUpdateAction,
      },
    },
    clickButton: { name: "Proces afbreken" },
    fillForm: {
      formValues: {
        Opmerking: "CancelPlannedDestructionList",
      },
    },
  },
  play: DeleteDestructionList.play,
};
