import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../../../.storybook/decorators";
import { MOCK_BASE } from "../../../../../../.storybook/mockData";
import {
  clickButton,
  clickCheckbox,
  fillForm,
} from "../../../../../../.storybook/playFunctions";
import {
  destructionListFactory,
  paginatedDestructionListItemsFactory,
  paginatedZakenFactory,
  recordManagerFactory, // usersFactory,
} from "../../../../../fixtures";
import { destructionListUpdateAction } from "../../DestructionListDetail.action";
import { destructionListDetailLoader } from "../../DestructionListDetail.loader";
import { DestructionListEditPage } from "./DestructionListEditPage";

const meta: Meta<typeof DestructionListEditPage> = {
  title: "Pages/DestructionList/DestructionListEditPage",
  component: DestructionListEditPage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        loader: destructionListDetailLoader,
        action: destructionListUpdateAction,
      },
      params: {
        uuid: "00000000-0000-0000-0000-000000000000",
      },
    },
    mockData: [
      ...MOCK_BASE,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000&ordering=-created",
        method: "GET",
        status: 200,
        response: [],
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-items/?item-destruction_list=00000000-0000-0000-0000-000000000000&item-status=suggested&viewMode=story&id=pages-destructionlist-destructionlisteditpage--edit-destruction-list&globals=",
        method: "GET",
        status: 200,
        response: paginatedDestructionListItemsFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/zaken/?viewMode=story&id=pages-destructionlist-destructionlisteditpage--edit-destruction-list&globals=&not_in_destruction_list_except=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: paginatedZakenFactory(),
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EditDestructionList: Story = {
  parameters: {
    mockData: [
      ...(meta?.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "GET",
        status: 200,
        response: destructionListFactory({
          uuid: "00000000-0000-0000-0000-000000000000",
          status: "new",
        }),
      },
    ],
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

export const DeleteDestructionList: Story = {
  parameters: {
    mockData: [
      ...(meta?.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "GET",
        status: 200,
        response: destructionListFactory({
          uuid: "00000000-0000-0000-0000-000000000000",
          status: "new",
        }),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "DELETE",
        status: 200,
        response: {},
      },
    ],
    clickButton: { name: "Lijst verwijderen" },
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

export const MarkDestructionListAsFinal: Story = {
  parameters: {
    mockData: [
      ...(meta?.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "GET",
        status: 200,
        response: destructionListFactory({
          uuid: "00000000-0000-0000-0000-000000000000",
          status: "internally_reviewed",
        }),
      },
    ],
    clickButton: { name: "Markeren als definitief" },
    fillForm: {
      formValues: {
        Archivaris: "Archi Varis (Archivaris)",
        Opmerking: "MarkDestructionListAsFinal",
      },
    },
  },
  play: async (context) => {
    await clickButton(context);
    await fillForm(context);
  },
};

export const QueueDestruction: Story = {
  parameters: {
    mockData: [
      ...(meta?.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "GET",
        status: 200,
        response: destructionListFactory({
          uuid: "00000000-0000-0000-0000-000000000000",
          status: "ready_to_delete",
        }),
      },
    ],
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

export const QueueFailedDestructionList: Story = {
  parameters: {
    mockData: [
      ...(meta?.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "GET",
        status: 200,
        response: destructionListFactory({
          uuid: "00000000-0000-0000-0000-000000000000",
          status: "ready_to_delete",
          processingStatus: "failed",
        }),
      },
    ],
    clickButton: { name: "Vernietigen herstarten" },
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

export const CancelPlannedDestructionList: Story = {
  parameters: {
    mockData: [
      ...(meta?.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "GET",
        status: 200,
        response: destructionListFactory({
          uuid: "00000000-0000-0000-0000-000000000000",
          status: "ready_to_delete",
          processingStatus: "queued",
          plannedDestructionDate: "2026-01-01T00:00:00Z",
        }),
      },
    ],
    clickButton: { name: "Proces afbreken" },
    fillForm: {
      formValues: {
        Opmerking: "My first destruction list",
      },
    },
  },
  play: async (context) => {
    await clickButton(context);
    await fillForm(context);
  },
};
