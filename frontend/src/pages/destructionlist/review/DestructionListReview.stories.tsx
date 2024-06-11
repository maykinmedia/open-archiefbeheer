import type { Meta, StoryObj } from "@storybook/react";

import { DestructionListReviewPage } from "./DestructionListReview";

const meta: Meta<typeof DestructionListReviewPage> = {
  title: "Pages/Review-destruction-list",
  component: DestructionListReviewPage,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReviewDestructionList: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};
