import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { fillForm } from "../../../.storybook/playFunctions";
import {
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

const RECORD_MANAGER = recordManagerFactory();
const REVIEWER1 = beoordelaarFactory();

const DESTRUCTION_LIST = destructionListFactory({
  name: "Test List",
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

export const UserCanEditName: Story = {
  args: { destructionList: DESTRUCTION_LIST },
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
    ],
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

export default meta;
type Story = StoryObj<typeof meta>;

export const Tabable: Story = {
  args: {
    destructionList: destructionListFactory(),
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    // Initial tab
    await expect(canvas.getByText("Auteur")).toBeVisible();

    // Click on history tab
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );
    await expect(await canvas.findByText("Datum")).toBeVisible();

    // Click on details tab
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
    // Click on history tab
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );

    // Assert content rendered
    expect((await canvas.findByRole("tabpanel")).children).toHaveLength(1);

    // Click on history tab again (collapse)
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );

    // Assert content not rendered
    expect((await canvas.findByRole("tabpanel")).children).toHaveLength(0);

    // Click on history tab again (expand)
    await userEvent.click(
      await canvas.findByRole("tab", { name: "Geschiedenis" }),
    );

    // Assert content rendered
    expect((await canvas.findByRole("tabpanel")).children).toHaveLength(1);
  },
};
