import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { MOCKS } from "../../../.storybook/mockData";
import { fillForm } from "../../../.storybook/playFunctions";
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
  play: async ({ context }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const editButton = await within(context.canvasElement).findByRole(
      "button",
      {
        name: "Archivaris bewerken",
      },
    );
    expect(editButton).toBeInTheDocument();

    await userEvent.click(editButton);
    const dialog = await within(context.canvasElement).findByRole("dialog");
    const form = dialog.querySelector("form");
    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          form: form,
          formValues: {
            Archivaris: "Archi Varis (Archivaris)",
            Reden: "Tada",
          },
          submitForm: true,
        },
      },
    });
  },
};

export const ReadyForArchivistSeenByArchivist: Story = {
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
        response: ARCHIVIST,
      },
    ],
  },
  play: async ({ context }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const editButton = await within(context.canvasElement).queryByRole(
      "button",
      {
        name: "Archivaris bewerken",
      },
    );
    expect(editButton).not.toBeInTheDocument();
  },
};
