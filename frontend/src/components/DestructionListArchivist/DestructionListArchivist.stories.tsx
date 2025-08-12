import { Meta, StoryObj } from "@storybook/react";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { MOCKS } from "../../../.storybook/mockData";
import {
  archivistFactory,
  destructionListFactory,
  recordManagerFactory,
} from "../../fixtures";
import { DestructionListArchivist } from "./DestructionListArchivist";

const RECORD_MANAGER = recordManagerFactory({
  pk: 1,
  username: "record_manager",
});
const REVIEWER = recordManagerFactory({ pk: 2, username: "reviewer" });
const ARCHIVIST = archivistFactory({ pk: 1, username: "archivist1" });

const meta: Meta<typeof DestructionListArchivist> = {
  title: "Components/DestructionListArchivist",
  component: DestructionListArchivist,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    mockData: [
      MOCKS.HEALTH_CHECK,
      MOCKS.ARCHIVISTS,
      MOCKS.OIDC_INFO,
      MOCKS.INTERNAL_SELECTIE_LIJST_CHOICES,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyForArchivist: Story = {
  args: {
    destructionList: destructionListFactory({
      author: RECORD_MANAGER,
      assignee: ARCHIVIST,
      status: "ready_for_archivist",
      assignees: [
        { user: RECORD_MANAGER, role: "author" },
        { user: REVIEWER, role: "main_reviewer" },
        { user: ARCHIVIST, role: "archivist" },
      ],
    }),
  },
};
