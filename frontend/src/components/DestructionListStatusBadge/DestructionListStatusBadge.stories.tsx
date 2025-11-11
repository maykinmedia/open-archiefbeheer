import { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";

import { destructionListFactory } from "../../fixtures/destructionList";
import { DestructionListStatusBadge } from "./DestructionListStatusBadge";

const meta: Meta<typeof DestructionListStatusBadge> = {
  title: "Components/DestructionListStatusBadge",
  component: DestructionListStatusBadge,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DestructionListStatusNew: Story = {
  args: {
    destructionList: destructionListFactory({ status: "new" }),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Nieuw");
  },
};

export const DestructionListStatusChangesRequested: Story = {
  args: {
    destructionList: destructionListFactory({ status: "changes_requested" }),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Wijzigingen aangevraagd");
  },
};

export const DestructionListStatusReadyToReview: Story = {
  args: {
    destructionList: destructionListFactory({ status: "ready_to_review" }),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Klaar voor beoordeling");
  },
};

export const DestructionListStatusInternallyReviewed: Story = {
  args: {
    destructionList: destructionListFactory({ status: "internally_reviewed" }),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Intern beoordeeld");
  },
};

export const DestructionListStatusReadyForArchivist: Story = {
  args: {
    destructionList: destructionListFactory({ status: "ready_for_archivist" }),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Klaar voor archivaris");
  },
};

export const DestructionListStatusReadyToDelete: Story = {
  args: {
    destructionList: destructionListFactory({ status: "ready_to_delete" }),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Klaar om te vernietigen");
  },
};

export const DestructionListStatusDeleted: Story = {
  args: {
    destructionList: destructionListFactory({ status: "deleted" }),
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Vernietigd");
  },
};
