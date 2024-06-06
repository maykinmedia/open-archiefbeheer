import type { Meta, StoryObj } from "@storybook/react";

import { ReviewDestructionListPage } from "./ReviewDestructionList";

const meta: Meta<typeof ReviewDestructionListPage> = {
  title: "Pages/Review-destruction-list",
  component: ReviewDestructionListPage,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReviewDestructionList: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};
