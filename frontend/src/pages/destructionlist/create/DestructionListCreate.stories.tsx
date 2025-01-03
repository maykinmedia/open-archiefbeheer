import type { Meta, StoryObj } from "@storybook/react";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../.storybook/decorators";
import {
  assertCheckboxSelection,
  assertColumnSelection,
  clickButton,
  fillForm,
} from "../../../../.storybook/playFunctions";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { usersFactory } from "../../../fixtures/user";
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
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
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
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE: DestructionListCreateContext = {
  reviewers: usersFactory(),
  paginatedZaken: paginatedZakenFactory(),
};

export const CheckboxSelection: Story = {
  play: assertCheckboxSelection,
};

export const ColumnSelection: Story = {
  play: assertColumnSelection,
};

export const CreateDestructionList: Story = {
  parameters: {
    assertCheckboxSelection: { direction: "forwards" },
    clickButton: { name: "Vernietigingslijst opstellen" },
    fillForm: {
      formValues: {
        Naam: "My First Destruction List",
        Reviewer: "Beoor del Laar (Beoor del Laar)",
        Opmerking: "CreateDestructionList",
      },
    },
  },
  play: async (context) => {
    await assertCheckboxSelection(context);
    await clickButton(context);
    await fillForm(context);
  },
};
