import { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";

import { formatDate } from "../../lib/format/date";
import { ProcessingStatusBadge } from "./ProcessingStatusBadge";

const meta: Meta<typeof ProcessingStatusBadge> = {
  title: "Components/ProcessingStatusBadge",
  component: ProcessingStatusBadge,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ProcessingStatusNew: Story = {
  args: {
    processingStatus: "new",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Nieuw");
  },
};

export const ProcessingStatusQueued: Story = {
  args: {
    processingStatus: "queued",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("In de wachtrij");
  },
};

export const ProcessingStatusProcessing: Story = {
  args: {
    processingStatus: "processing",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Verwerken");
  },
};

export const ProcessingStatusSucceeded: Story = {
  args: {
    processingStatus: "succeeded",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Succesvol");
  },
};

export const ProcessingStatusFailed: Story = {
  args: {
    processingStatus: "failed",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Mislukt");
  },
};

export const PlannedDestructionDateInPast: Story = {
  args: {
    processingStatus: "new",
    plannedDestructionDate: "1990-10-31",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Wordt vernietigd");
  },
};

export const PlannedDestructionDateInFuture: Story = {
  args: {
    processingStatus: "new",
    plannedDestructionDate: formatDate(
      new Date(new Date().getTime() + 86400000),
      "iso",
    ),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Wordt vernietigd over", {
      exact: false,
    });
  },
};
