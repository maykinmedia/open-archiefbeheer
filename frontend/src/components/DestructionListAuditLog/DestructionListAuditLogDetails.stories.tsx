import { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";

import { auditLogItemFactory } from "../../fixtures/auditLog";
import { userFactory } from "../../fixtures/user";
import { DestructionListAuditLogDetails } from "./DestructionListAuditLogDetails";

const meta: Meta<typeof DestructionListAuditLogDetails> = {
  title: "Components/Audit Log/DestructionListAuditLogDetails",
  component: DestructionListAuditLogDetails,
};

export default meta;

// Story for DestructionListAuditLogDetails
export const AuditLogDetails: StoryObj<typeof DestructionListAuditLogDetails> =
  {
    render: (args) => <DestructionListAuditLogDetails {...args} />,
    args: {
      readyForFirstReviewLogItem: auditLogItemFactory({
        extraData: {
          minArchiefactiedatum: "2021-01-01T00:00:00Z",
          maxArchiefactiedatum: "2021-12-31T00:00:00Z",
          comment: "This is a comment",
          numberOfZaken: 10,
          zaaktypen: [
            { label: "Zaaktype 1", value: "1" },
            { label: "Zaaktype 2", value: "2" },
          ],
          resultaten: [
            { label: "Resultaat 1", value: "1" },
            { label: "Resultaat 2", value: "2" },
          ],
        },
        user: userFactory({
          username: "johndoe",
          firstName: "John",
          lastName: "Doe",
        }),
      }),
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);

      const rows = canvas.getAllByRole("row");
      expect(rows).toHaveLength(7);

      expect(canvas.getByText("John Doe (johndoe)")).toBeInTheDocument();
      expect(
        canvas.getByText("01/01/2021", { exact: false }),
      ).toBeInTheDocument();
      expect(
        canvas.getByText("31/12/2021", { exact: false }),
      ).toBeInTheDocument();
      expect(canvas.getByText("Zaaktype 1, Zaaktype 2")).toBeInTheDocument();
      expect(canvas.getByText("This is a comment")).toBeInTheDocument();
      expect(canvas.getByText("10")).toBeInTheDocument();
    },
  };
