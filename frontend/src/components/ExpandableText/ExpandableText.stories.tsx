import { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { ExpandableText as ExpandableTextComponent } from "./ExpandableText";

const meta: Meta<typeof ExpandableTextComponent> = {
  title: "Components/ExpandableText",
  component: ExpandableTextComponent,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ExpandableText: Story = {
  args: {
    text: "This is a long text that should be cut off at the end. This is a long text that should be cut off at the end. This is a long text that should be cut off at the end.",
    fieldName: "fieldName",
  },
  play: async ({ canvasElement }) => {
    setTimeout(async () => {
      const button = within(canvasElement).getByRole("button", {
        name: "fieldName",
      });
      await expect(button).toBeInTheDocument();
      await userEvent.click(button);

      const dialog = within(canvasElement).getByRole("dialog");
      await expect(dialog).not.toBeNull();

      await expect(dialog).toHaveTextContent("fieldName");
      await expect(dialog).toHaveTextContent(
        "This is a long text that should be cut off at the end. This is a long text that should be cut off at the end. This is a long text that should be cut off at the end.",
      );
    }, 0);
  },
};
