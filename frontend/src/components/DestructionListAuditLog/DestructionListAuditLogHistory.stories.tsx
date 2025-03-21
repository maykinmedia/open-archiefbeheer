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
    expect(rows).toHaveLength(4);

    expect(rows[1]).toHaveTextContent("31/10/1990");
    expect(rows[1]).toHaveTextContent("John Doe (johndoe)");
    expect(rows[1]).toHaveTextContent("Record Manager");
    expect(rows[1]).toHaveTextContent("Destruction list created.");

    expect(rows[2]).toHaveTextContent("02/08/1988");
    expect(rows[2]).toHaveTextContent("Jane Doe (janedoe)");
    expect(rows[2]).toHaveTextContent("Record Manager, Reviewer");
    expect(rows[2]).toHaveTextContent("Destruction list deleted.");

    expect(rows[3]).toHaveTextContent("15/09/2023");
    expect(rows[3]).toHaveTextContent("Jet Doe (jetdoe)");
    expect(rows[3]).toHaveTextContent("Administrator");
    expect(rows[3]).toHaveTextContent("Destruction list updated.");
  },
};

export const AuditLogItemsSortDate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateColumn = await canvas.findByRole("button", { name: "Datum" });
    await userEvent.click(dateColumn);

    const asc = canvas.getAllByRole("row");
    expect(asc).toHaveLength(4);
    expect(asc[1]).toHaveTextContent("02/08/1988");
    expect(asc[1]).toHaveTextContent("Jane Doe (janedoe)");
    expect(asc[1]).toHaveTextContent("Record Manager, Reviewer");
    expect(asc[1]).toHaveTextContent("Destruction list deleted.");

    expect(asc[2]).toHaveTextContent("31/10/1990");
    expect(asc[2]).toHaveTextContent("John Doe (johndoe)");
    expect(asc[2]).toHaveTextContent("Record Manager");
    expect(asc[2]).toHaveTextContent("Destruction list created.");

    expect(asc[3]).toHaveTextContent("15/09/2023");
    expect(asc[3]).toHaveTextContent("Jet Doe (jetdoe)");
    expect(asc[3]).toHaveTextContent("Administrator");
    expect(asc[3]).toHaveTextContent("Destruction list updated.");

    await userEvent.click(dateColumn);

    const desc = canvas.getAllByRole("row");
    expect(asc).toHaveLength(4);

    expect(desc[1]).toHaveTextContent("15/09/2023");
    expect(desc[1]).toHaveTextContent("Jet Doe (jetdoe)");
    expect(desc[1]).toHaveTextContent("Administrator");
    expect(desc[1]).toHaveTextContent("Destruction list updated.");

    expect(desc[2]).toHaveTextContent("31/10/1990");
    expect(desc[2]).toHaveTextContent("John Doe (johndoe)");
    expect(desc[2]).toHaveTextContent("Record Manager");
    expect(desc[2]).toHaveTextContent("Destruction list created.");

    expect(desc[3]).toHaveTextContent("02/08/1988");
    expect(desc[3]).toHaveTextContent("Jane Doe (janedoe)");
    expect(desc[3]).toHaveTextContent("Record Manager, Reviewer");
    expect(desc[3]).toHaveTextContent("Destruction list deleted.");
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
    expect(asc).toHaveLength(4);
    expect(asc[1]).toHaveTextContent("02/08/1988");
    expect(asc[1]).toHaveTextContent("Jane Doe (janedoe)");
    expect(asc[1]).toHaveTextContent("Record Manager, Reviewer");
    expect(asc[1]).toHaveTextContent("Destruction list deleted.");

    expect(asc[2]).toHaveTextContent("15/09/2023");
    expect(asc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    expect(asc[2]).toHaveTextContent("Administrator");
    expect(asc[2]).toHaveTextContent("Destruction list updated.");

    expect(asc[3]).toHaveTextContent("31/10/1990");
    expect(asc[3]).toHaveTextContent("John Doe (johndoe)");
    expect(asc[3]).toHaveTextContent("Record Manager");
    expect(asc[3]).toHaveTextContent("Destruction list created.");

    await userEvent.click(nameColumn);

    const desc = canvas.getAllByRole("row");
    expect(asc).toHaveLength(4);

    expect(desc[1]).toHaveTextContent("31/10/1990");
    expect(desc[1]).toHaveTextContent("John Doe (johndoe)");
    expect(desc[1]).toHaveTextContent("Record Manager");
    expect(desc[1]).toHaveTextContent("Destruction list created.");

    expect(desc[2]).toHaveTextContent("15/09/2023");
    expect(desc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    expect(desc[2]).toHaveTextContent("Administrator");
    expect(desc[2]).toHaveTextContent("Destruction list updated.");

    expect(desc[3]).toHaveTextContent("02/08/1988");
    expect(desc[3]).toHaveTextContent("Jane Doe (janedoe)");
    expect(desc[3]).toHaveTextContent("Record Manager, Reviewer");
    expect(desc[3]).toHaveTextContent("Destruction list deleted.");
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
    expect(asc).toHaveLength(4);

    expect(asc[1]).toHaveTextContent("02/08/1988");
    expect(asc[1]).toHaveTextContent("Jane Doe (janedoe)");
    expect(asc[1]).toHaveTextContent("Record Manager, Reviewer");
    expect(asc[1]).toHaveTextContent("Destruction list deleted.");

    expect(asc[2]).toHaveTextContent("15/09/2023");
    expect(asc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    expect(asc[2]).toHaveTextContent("Administrator");
    expect(asc[2]).toHaveTextContent("Destruction list updated.");

    expect(asc[3]).toHaveTextContent("31/10/1990");
    expect(asc[3]).toHaveTextContent("John Doe (johndoe)");
    expect(asc[3]).toHaveTextContent("Record Manager");
    expect(asc[3]).toHaveTextContent("Destruction list created.");

    await userEvent.click(nameColumn);

    const desc = canvas.getAllByRole("row");
    expect(asc).toHaveLength(4);

    expect(desc[1]).toHaveTextContent("31/10/1990");
    expect(desc[1]).toHaveTextContent("John Doe (johndoe)");
    expect(desc[1]).toHaveTextContent("Record Manager");
    expect(desc[1]).toHaveTextContent("Destruction list created.");

    expect(desc[2]).toHaveTextContent("15/09/2023");
    expect(desc[2]).toHaveTextContent("Jet Doe (jetdoe)");
    expect(desc[2]).toHaveTextContent("Administrator");
    expect(desc[2]).toHaveTextContent("Destruction list updated.");

    expect(desc[3]).toHaveTextContent("02/08/1988");
    expect(desc[3]).toHaveTextContent("Jane Doe (janedoe)");
    expect(desc[3]).toHaveTextContent("Record Manager, Reviewer");
    expect(desc[3]).toHaveTextContent("Destruction list deleted.");
  },
};
