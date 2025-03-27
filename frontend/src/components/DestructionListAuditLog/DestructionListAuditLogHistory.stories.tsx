import { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "@storybook/test";

import { auditLogItemFactory } from "../../fixtures/auditLog";
import { userFactory } from "../../fixtures/user";
import { formatDate } from "../../lib/format/date";
import { DestructionListAuditLogHistory } from "./DestructionListAuditLogHistory";

const meta: Meta<typeof DestructionListAuditLogHistory> = {
  title: "Components/Audit Log/DestructionListAuditLogHistory",
  component: DestructionListAuditLogHistory,
  args: {
    logItems: [
      auditLogItemFactory({
        timestamp: formatDate(new Date("1990-10-31"), "iso"),
        user: userFactory({
          username: "johndoe",
          firstName: "John",
          lastName: "Doe",
        }),
        extraData: { userGroups: ["Record Manager"] },
        message: "Destruction list created.",
      }),

      auditLogItemFactory({
        timestamp: formatDate(new Date("1988-08-02"), "iso"),
        user: userFactory({
          username: "janedoe",
          firstName: "Jane",
          lastName: "Doe",
        }),
        extraData: { userGroups: ["Record Manager", "Reviewer"] },
        message: "Destruction list deleted.",
      }),

      auditLogItemFactory({
        timestamp: formatDate(new Date("2023-09-15"), "iso"),
        user: userFactory({
          username: "jetdoe",
          firstName: "Jet",
          lastName: "Doe",
        }),
        extraData: { userGroups: ["Administrator"] },
        message: "Destruction list updated.",
      }),
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AuditLogItemsVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = await canvas.findAllByRole("row");

    await waitFor(
      async () => {
        // await expect(rows).toHaveLength(4);

        await expect(rows[1]).toHaveTextContent("31/10/1990");
        await expect(rows[1]).toHaveTextContent("John Doe (johndoe)");
        await expect(rows[1]).toHaveTextContent("Record Manager");
        await expect(rows[1]).toHaveTextContent("Destruction list created.");

        await expect(rows[2]).toHaveTextContent("02/08/1988");
        await expect(rows[2]).toHaveTextContent("Jane Doe (janedoe)");
        await expect(rows[2]).toHaveTextContent("Record Manager, Reviewer");
        await expect(rows[2]).toHaveTextContent("Destruction list deleted.");

        await expect(rows[3]).toHaveTextContent("15/09/2023");
        await expect(rows[3]).toHaveTextContent("Jet Doe (jetdoe)");
        await expect(rows[3]).toHaveTextContent("Administrator");
        await expect(rows[3]).toHaveTextContent("Destruction list updated.");
      },
      { timeout: 3000 },
    );
  },
};
