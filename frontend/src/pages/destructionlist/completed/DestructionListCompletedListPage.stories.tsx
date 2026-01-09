import { Meta, StoryObj } from "@storybook/react-vite";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../.storybook/decorators";
import { MOCK_BASE } from "../../../../.storybook/mockData";
import {
  destructionListFactory,
  recordManagerFactory,
} from "../../../fixtures";
import { DestructionListCompletedListPage as DestructionListCompletedListPageComponent } from "./DestructionListCompletedListPage";
import { destructionListCompletedListLoader } from "./DestructionListCompletedListPage.loader";

const meta: Meta<typeof DestructionListCompletedListPage> = {
  title: "Pages/DestructionList/DestructionListCompletedListPage",
  component: DestructionListCompletedListPageComponent,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: destructionListCompletedListLoader,
      },
    },
  },
};

export default meta;

export const DestructionListCompletedListPage: StoryObj<
  typeof DestructionListCompletedListPageComponent
> = {
  parameters: {
    mockData: [
      ...MOCK_BASE,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/completed-destruction-lists/",
        method: "GET",
        status: 200,
        response: {
          count: 971,
          next: "http://localhost:8000/api/v1/completed-destruction-lists/?page=2",
          previous: null,
          results: [destructionListFactory({ status: "deleted" })],
        },
      },
    ],
  },
};
