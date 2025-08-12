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
  beoordelaarFactory,
  destructionListFactory,
  recordManagerFactory,
  reviewFactory,
} from "../../fixtures";
import { DestructionListToolbar } from "./DestructionListToolbar";

const meta: Meta<typeof DestructionListToolbar> = {
  title: "Components/DestructionListToolbar",
  component: DestructionListToolbar,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const RECORD_MANAGER = recordManagerFactory();
const REVIEWER1 = beoordelaarFactory();
const ARCHIVIST = archivistFactory({ pk: 1, username: "archivist1" });

const DESTRUCTION_LIST = destructionListFactory({
  name: "Test List",
  author: RECORD_MANAGER,
  assignee: REVIEWER1,
  comment: "Sample comment",
  status: "new",
});
const UPDATED_NAME_DESTRUCTION_LIST = destructionListFactory({
  name: "Updated List Name",
  author: RECORD_MANAGER,
  assignee: REVIEWER1,
  comment: "Sample comment",
  status: "new",
});

const REVIEW = reviewFactory({
  author: REVIEWER1,
  decision: "accepted",
  listFeedback: "Looks good.",
});

const baseMocks = [
  MOCKS.OIDC_INFO,
  MOCKS.AUDIT_LOG,
  MOCKS.DESTRUCTION_LIST_CO_REVIEWERS,
  MOCKS.CO_REVIEWERS,
  {
    url: "http://localhost:8000/api/v1/whoami/",
    method: "GET",
    status: 200,
    response: RECORD_MANAGER,
  },
  {
    url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000",
    method: "GET",
    status: 200,
    response: [],
  },
  {
    url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/",
    method: "PATCH",
    status: 200,
    response: [UPDATED_NAME_DESTRUCTION_LIST],
  },
];

export const UserCanEditName: Story = {
  args: { destructionList: DESTRUCTION_LIST },
  parameters: {
    mockData: [...baseMocks],
  },
  play: async (context) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const editButton = await within(context.canvasElement).getByRole("button", {
      name: "Naam bewerken",
    });
    await userEvent.click(editButton);
    const dialog = await within(context.canvasElement).findByRole("dialog");
    const form = dialog.querySelector("form");
    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          form: form,
          formValues: {
            Naam: "Updated List Name",
          },
          submitForm: true,
        },
      },
    });
  },
};

export const WithArchivarisMenu: Story = {
  args: {
    destructionList: destructionListFactory({
      author: RECORD_MANAGER,
      assignee: ARCHIVIST,
      status: "ready_for_archivist",
      assignees: [
        { user: RECORD_MANAGER, role: "author" },
        { user: REVIEWER1, role: "main_reviewer" },
        { user: ARCHIVIST, role: "archivist" },
      ],
    }),
  },
  parameters: {
    mockData: [
      MOCKS.OIDC_INFO,
      MOCKS.AUDIT_LOG,
      MOCKS.ARCHIVISTS,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: [],
      },
    ],
  },
  play: async ({ context }) => {
    const canvas = within(context.canvasElement);
    const archivaris = canvas.getByText("Archivaris");
    expect(archivaris).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 600));
    const editButton = await within(context.canvasElement).getByRole("button", {
      name: "Archivaris bewerken",
    });

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

export const WithReviewDetails: Story = {
  args: { destructionList: DESTRUCTION_LIST, review: REVIEW },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lastReviewer = canvas.getByText("Laatste review door");
    expect(lastReviewer).toBeInTheDocument();
    const opmerking = canvas.getByText("Opmerking");
    expect(opmerking).toBeInTheDocument();
    const beoordeling = canvas.getByText("Beoordeling");
    expect(beoordeling).toBeInTheDocument();
  },
};

export const WithReviewDetailsFromArchivaris: Story = {
  args: {
    destructionList: destructionListFactory({
      author: RECORD_MANAGER,
      assignee: RECORD_MANAGER,
      status: "changes_requested",
      assignees: [
        { user: RECORD_MANAGER, role: "author" },
        { user: REVIEWER1, role: "main_reviewer" },
        { user: ARCHIVIST, role: "archivist" },
      ],
    }),
    review: reviewFactory({
      author: ARCHIVIST,
      decision: "rejected",
      listFeedback: "Looks bad.",
    }),
  },
  parameters: {
    mockData: [...baseMocks, MOCKS.REVIEW_RESPONSES],
  },
};

export const HandleSubmitSuccess: Story = {
  args: { destructionList: DESTRUCTION_LIST },
  parameters: {
    mockData: [
      ...baseMocks,
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/",
        method: "PATCH",
        status: 200,
        response: {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const editButton = await canvas.getByRole("button", {
      name: "Naam bewerken",
    });
    await userEvent.click(editButton);
    const dialog = await canvas.findByRole("dialog");
    const form = dialog.querySelector("form")!;
    const nameInput = within(form).getByLabelText("Naam");
    const submitButton = within(form).getByRole("button", { name: "Opslaan" });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated List Name");
    await userEvent.click(submitButton);
    await expect(editButton).toBeVisible();
  },
};

export const HandleSubmitError: Story = {
  args: { destructionList: DESTRUCTION_LIST },
  parameters: {
    mockData: [
      ...baseMocks,
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/",
        method: "PATCH",
        status: 400,
        response: { detail: "Error occurred while updating." },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const editButton = await canvas.getByRole("button", {
      name: "Naam bewerken",
    });
    await userEvent.click(editButton);
    const dialog = await canvas.findByRole("dialog");
    const form = dialog.querySelector("form")!;
    const nameInput = within(form).getByLabelText("Naam");
    const submitButton = within(form).getByRole("button", { name: "Opslaan" });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Invalid Name");
    await userEvent.click(submitButton);
    await canvas.findByText("Foutmelding");
    await canvas.findByText("Error occurred while updating.");
  },
};

export const Tabable: Story = {
  args: {
    destructionList: destructionListFactory(),
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );
    await expect(await canvas.findByText("Datum")).toBeVisible();
    await userEvent.click(await canvas.findByRole("tab", { name: "Details" }));
    await expect(canvas.getByText("Min/max archiefactiedatum")).toBeVisible();
  },
};

export const Collapsible: Story = {
  args: {
    destructionList: destructionListFactory(),
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );
    expect((await canvas.findByRole("tabpanel")).children).toHaveLength(1);
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );
    expect((await canvas.findByRole("tabpanel")).children).toHaveLength(0);
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );
    expect((await canvas.findByRole("tabpanel")).children).toHaveLength(1);
  },
};
