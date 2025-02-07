import type { Meta, StoryObj } from "@storybook/react";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../.storybook/decorators";
import { MOCKS } from "../../../../.storybook/mockData";
import {
  assertCheckboxSelection,
  assertColumnSelection,
  clickButton,
  fillForm,
} from "../../../../.storybook/playFunctions";
import { destructionListFactory } from "../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { recordManagerFactory, usersFactory } from "../../../fixtures/user";
import { DestructionListCreatePage } from "./DestructionListCreate";
import { destructionListCreateAction } from "./DestructionListCreate.action";
import { destructionListCreateLoader } from "./DestructionListCreate.loader";

const meta: Meta<typeof DestructionListCreatePage> = {
  title: "Pages/DestructionList/DestructionListCreatePage",
  component: DestructionListCreatePage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: destructionListCreateLoader,
        action: destructionListCreateAction,
      },
    },
    mockData: [
      MOCKS.OIDC_INFO,
      MOCKS.SELECTIE_LIJST_CHOICES,
      MOCKS.ZAAKTYPE_CHOICES,
      MOCKS.ZAKEN_SEARCH,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/zaken/?viewMode=story&id=pages-destructionlist-destructionlistcreatepage--checkbox-selection&not_in_destruction_list=true",
        method: "GET",
        status: 200,
        response: paginatedZakenFactory(),
      },
      {
        url: "hhttp://localhost:8000/api/v1/users?role=main_reviewer",
        method: "GET",
        status: 200,
        response: usersFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/?",
        method: "POST",
        status: 201,
        response: destructionListFactory(),
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxSelection: Story = {
  play: assertCheckboxSelection,
};

export const ColumnSelection: Story = {
  play: assertColumnSelection,
};

export const CreateDestructionList: Story = {
  parameters: {
    assertCheckboxSelection: { direction: "forwards" },
    clickButton: {
      name: "Vernietigingslijst opstellen",
      inTBody: false,
      elementIndex: 1,
    },
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
