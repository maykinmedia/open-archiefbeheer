import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

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
    const rows = canvas.getAllByRole("row");

    await expect(rows).toHaveLength(4);

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
};

export const AuditLogItemsSortDate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateColumn = await canvas.findByRole("button", { name: "Datum" });
    await userEvent.click(dateColumn);

    const asc = canvas.getAllByRole("row");
    await expect(asc).toHaveLength(4);
    await expect(asc[1]).toHaveTextContent("02/08/1988");
    await expect(asc[1]).toHaveTextContent("Jane Doe (janedoe)");
    await expect(asc[1]).toHaveTextContent("Record Manager, Reviewer");
    await expect(asc[1]).toHaveTextContent("Destruction list deleted.");

    await expect(asc[2]).toHaveTextContent("31/10/1990");
    await expect(asc[2]).toHaveTextContent("John Doe (johndoe)");
    await expect(asc[2]).toHaveTextContent("Record Manager");
    await expect(asc[2]).toHaveTextContent("Destruction list created.");

    await expect(asc[3]).toHaveTextContent("15/09/2023");
    await expect(asc[3]).toHaveTextContent("Jet Doe (jetdoe)");
    await expect(asc[3]).toHaveTextContent("Administrator");
    await expect(asc[3]).toHaveTextContent("Destruction list updated.");

    await userEvent.click(dateColumn);

    const desc = canvas.getAllByRole("row");
    await expect(asc).toHaveLength(4);

    await expect(desc[1]).toHaveTextContent("15/09/2023");
    await expect(desc[1]).toHaveTextContent("Jet Doe (jetdoe)");
    await expect(desc[1]).toHaveTextContent("Administrator");
    await expect(desc[1]).toHaveTextContent("Destruction list updated.");

    await expect(desc[2]).toHaveTextContent("31/10/1990");
    await expect(desc[2]).toHaveTextContent("John Doe (johndoe)");
    await expect(desc[2]).toHaveTextContent("Record Manager");
    await expect(desc[2]).toHaveTextContent("Destruction list created.");

    await expect(desc[3]).toHaveTextContent("02/08/1988");
    await expect(desc[3]).toHaveTextContent("Jane Doe (janedoe)");
    await expect(desc[3]).toHaveTextContent("Record Manager, Reviewer");
    await expect(desc[3]).toHaveTextContent("Destruction list deleted.");
  },
};

export const AuditLogItemsSortName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameColumn = await canvas.findByRole("button", {
      name: "Gewijzigd door",
    });
    await userEvent.click(nameColumn);

    const asc = canvas.getAllByRole("row");
    await expect(asc).toHaveLength(4);
    await expect(asc[1]).toHaveTextContent("02/08/1988");
    await expect(asc[1]).toHaveTextContent("Jane Doe (janedoe)");
    await expect(asc[1]).toHaveTextContent("Record Manager, Reviewer");
    await expect(asc[1]).toHaveTextContent("Destruction list deleted.");

    await expect(asc[2]).toHaveTextContent("15/09/2023");
    await expect(asc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    await expect(asc[2]).toHaveTextContent("Administrator");
    await expect(asc[2]).toHaveTextContent("Destruction list updated.");

    await expect(asc[3]).toHaveTextContent("31/10/1990");
    await expect(asc[3]).toHaveTextContent("John Doe (johndoe)");
    await expect(asc[3]).toHaveTextContent("Record Manager");
    await expect(asc[3]).toHaveTextContent("Destruction list created.");

    await userEvent.click(nameColumn);

    const desc = canvas.getAllByRole("row");
    await expect(asc).toHaveLength(4);

    await expect(desc[1]).toHaveTextContent("31/10/1990");
    await expect(desc[1]).toHaveTextContent("John Doe (johndoe)");
    await expect(desc[1]).toHaveTextContent("Record Manager");
    await expect(desc[1]).toHaveTextContent("Destruction list created.");

    await expect(desc[2]).toHaveTextContent("15/09/2023");
    await expect(desc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    await expect(desc[2]).toHaveTextContent("Administrator");
    await expect(desc[2]).toHaveTextContent("Destruction list updated.");

    await expect(desc[3]).toHaveTextContent("02/08/1988");
    await expect(desc[3]).toHaveTextContent("Jane Doe (janedoe)");
    await expect(desc[3]).toHaveTextContent("Record Manager, Reviewer");
    await expect(desc[3]).toHaveTextContent("Destruction list deleted.");
  },
};

export const AuditLogItemsSortMessage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameColumn = await canvas.findByRole("button", {
      name: "Gewijzigd door",
    });
    await userEvent.click(nameColumn);

    const asc = canvas.getAllByRole("row");
    await expect(asc).toHaveLength(4);

    await expect(asc[1]).toHaveTextContent("02/08/1988");
    await expect(asc[1]).toHaveTextContent("Jane Doe (janedoe)");
    await expect(asc[1]).toHaveTextContent("Record Manager, Reviewer");
    await expect(asc[1]).toHaveTextContent("Destruction list deleted.");

    await expect(asc[2]).toHaveTextContent("15/09/2023");
    await expect(asc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    await expect(asc[2]).toHaveTextContent("Administrator");
    await expect(asc[2]).toHaveTextContent("Destruction list updated.");

    await expect(asc[3]).toHaveTextContent("31/10/1990");
    await expect(asc[3]).toHaveTextContent("John Doe (johndoe)");
    await expect(asc[3]).toHaveTextContent("Record Manager");
    await expect(asc[3]).toHaveTextContent("Destruction list created.");

    await userEvent.click(nameColumn);

    const desc = canvas.getAllByRole("row");
    await expect(asc).toHaveLength(4);

    await expect(desc[1]).toHaveTextContent("31/10/1990");
    await expect(desc[1]).toHaveTextContent("John Doe (johndoe)");
    await expect(desc[1]).toHaveTextContent("Record Manager");
    await expect(desc[1]).toHaveTextContent("Destruction list created.");

    await expect(desc[2]).toHaveTextContent("15/09/2023");
    await expect(desc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    await expect(desc[2]).toHaveTextContent("Administrator");
    await expect(desc[2]).toHaveTextContent("Destruction list updated.");

    await expect(desc[3]).toHaveTextContent("02/08/1988");
    await expect(desc[3]).toHaveTextContent("Jane Doe (janedoe)");
    await expect(desc[3]).toHaveTextContent("Record Manager, Reviewer");
    await expect(desc[3]).toHaveTextContent("Destruction list deleted.");
  },
};
