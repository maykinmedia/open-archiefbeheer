import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { destructionListFactory } from "../../fixtures";
import { DestructionListToolbar } from "./DestructionListToolbar";

const meta: Meta<typeof DestructionListToolbar> = {
  title: "Components/DestructionListToolbar",
  component: DestructionListToolbar,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
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
