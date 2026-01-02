import { Meta, StoryObj } from "@storybook/react-vite";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../.storybook/decorators";
import { MOCKS } from "../../../../.storybook/mockData";
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
      MOCKS.HEALTH_CHECK,
      MOCKS.OIDC_INFO,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/?page=1&status=deleted",
        method: "GET",
        status: 200,
        response: {
          count: 1,
          next: null,
          previous: null,
          results: [destructionListFactory({ status: "deleted" })],
        },
      },
    ],
  },
};
