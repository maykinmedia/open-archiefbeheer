import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

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
        message:
          '[1990-10-31T00:00:00+01:00]: Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
      }),

      auditLogItemFactory({
        timestamp: formatDate(new Date("1988-08-02"), "iso"),
        user: userFactory({
          username: "janedoe",
          firstName: "Jane",
          lastName: "Doe",
        }),
        message:
          '[1988-08-02T00:00:00+01:00]: Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
      }),

      auditLogItemFactory({
        timestamp: formatDate(new Date("2023-09-15"), "iso"),
        user: userFactory({
          username: "jetdoe",
          firstName: "Jet",
          lastName: "Doe",
        }),
        message:
          '[2023-09-15T00:00:00+01:00]: Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
      }),
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AuditLogItemsVisible: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      const canvas = within(canvasElement);
      const rows = canvas.getAllByRole("row");
      expect(rows).toHaveLength(4);
      await within(rows[1]).findByText("31/10/1990", { exact: false });
      await within(rows[1]).findByText("John Doe (johndoe)");
      await within(rows[1]).findByText(
        'Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
        { exact: false },
      );

      await within(rows[2]).findByText("02/08/1988", { exact: false });
      await within(rows[2]).findByText("Jane Doe (janedoe)");
      await within(rows[2]).findByText(
        'Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
        { exact: false },
      );

      await within(rows[3]).findByText("15/09/2023", { exact: false });
      await within(rows[3]).findByText("Jet Doe (jetdoe)");
      await within(rows[3]).findByText(
        'Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
        { exact: false },
      );
    });
  },
};

export const AuditLogItemsSortDate: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      const canvas = within(canvasElement);
      const dateColumn = await canvas.findByRole("button", { name: "Datum" });
      await userEvent.click(dateColumn);

      const asc = canvas.getAllByRole("row");
      expect(asc).toHaveLength(4);
      await within(asc[1]).findByText("02/08/1988", { exact: false });
      await within(asc[1]).findByText("Jane Doe (janedoe)");
      await within(asc[1]).findByText(
        'Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
        { exact: false },
      );

      await within(asc[2]).findByText("31/10/1990", { exact: false });
      await within(asc[2]).findByText("John Doe (johndoe)");
      await within(asc[2]).findByText(
        'Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
        { exact: false },
      );

      await within(asc[3]).findByText("15/09/2023", { exact: false });
      await within(asc[3]).findByText("Jet Doe (jetdoe)");
      await within(asc[3]).findByText(
        'Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
        { exact: false },
      );

      await userEvent.click(dateColumn);

      const desc = canvas.getAllByRole("row");
      expect(asc).toHaveLength(4);

      await within(desc[1]).findByText("15/09/2023", { exact: false });
      await within(desc[1]).findByText("Jet Doe (jetdoe)");
      await within(desc[1]).findByText(
        'Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
        { exact: false },
      );

      await within(desc[2]).findByText("31/10/1990", { exact: false });
      await within(desc[2]).findByText("John Doe (johndoe)");
      await within(desc[2]).findByText(
        'Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
        { exact: false },
      );

      await within(desc[3]).findByText("02/08/1988", { exact: false });
      await within(desc[3]).findByText("Jane Doe (janedoe)");
      await within(desc[3]).findByText(
        'Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
        { exact: false },
      );
    });
  },
};

export const AuditLogItemsSortName: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      const canvas = within(canvasElement);
      const nameColumn = await canvas.findByRole("button", {
        name: "Gewijzigd door",
      });
      await userEvent.click(nameColumn);

      const asc = canvas.getAllByRole("row");
      expect(asc).toHaveLength(4);
      await within(asc[1]).findByText("02/08/1988", { exact: false });
      await within(asc[1]).findByText("Jane Doe (janedoe)");
      await within(asc[1]).findByText(
        'Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
        { exact: false },
      );

      await within(asc[2]).findByText("15/09/2023", { exact: false });
      await within(asc[2]).findByText("Jet Doe (jetdoe)");
      await within(asc[2]).findByText(
        'Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
        { exact: false },
      );

      await within(asc[3]).findByText("31/10/1990", { exact: false });
      await within(asc[3]).findByText("John Doe (johndoe)");
      await within(asc[3]).findByText(
        'Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
        { exact: false },
      );

      await userEvent.click(nameColumn);

      const desc = canvas.getAllByRole("row");
      expect(asc).toHaveLength(4);

      await within(desc[1]).findByText("31/10/1990", { exact: false });
      await within(desc[1]).findByText("John Doe (johndoe)");
      await within(desc[1]).findByText(
        'Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
        { exact: false },
      );

      await within(desc[2]).findByText("15/09/2023", { exact: false });
      await within(desc[2]).findByText("Jet Doe (jetdoe)");
      await within(desc[2]).findByText(
        'Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
        { exact: false },
      );

      await within(desc[3]).findByText("02/08/1988", { exact: false });
      await within(desc[3]).findByText("Jane Doe (janedoe)");
      await within(desc[3]).findByText(
        'Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
        { exact: false },
      );
    });
  },
};

export const AuditLogItemsSortMessage: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      const canvas = within(canvasElement);
      const nameColumn = await canvas.findByRole("button", {
        name: "Wijziging",
      });
      await userEvent.click(nameColumn);

      const asc = canvas.getAllByRole("row");
      expect(asc).toHaveLength(4);
      await within(asc[1]).findByText("02/08/1988", { exact: false });
      await within(asc[1]).findByText("Jane Doe (janedoe)");
      await within(asc[1]).findByText(
        'Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
        { exact: false },
      );

      await within(asc[2]).findByText("31/10/1990", { exact: false });
      await within(asc[2]).findByText("John Doe (johndoe)");
      await within(asc[2]).findByText(
        'Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
        { exact: false },
      );

      await within(asc[3]).findByText("15/09/2023", { exact: false });
      await within(asc[3]).findByText("Jet Doe (jetdoe)");
      await within(asc[3]).findByText(
        'Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
        { exact: false },
      );

      await userEvent.click(nameColumn);

      const desc = canvas.getAllByRole("row");
      expect(asc).toHaveLength(4);

      await within(desc[1]).findByText("15/09/2023", { exact: false });
      await within(desc[1]).findByText("Jet Doe (jetdoe)");
      await within(desc[1]).findByText(
        'Destruction list "My Third Destruction List" created by user Jet Doe (jetdoe).',
        { exact: false },
      );

      await within(desc[2]).findByText("31/10/1990", { exact: false });
      await within(desc[2]).findByText("John Doe (johndoe)");
      await within(desc[2]).findByText(
        'Destruction list "My Second Destruction List" created by user John Doe (johndoe).',
        { exact: false },
      );

      await within(desc[3]).findByText("02/08/1988", { exact: false });
      await within(desc[3]).findByText("Jane Doe (janedoe)");
      await within(desc[3]).findByText(
        'Destruction list "My First Destruction List" created by user Jane Doe (janedoe).',
        { exact: false },
      );
    });
  },
};
