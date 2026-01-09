import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../../.storybook/decorators";
import { MOCKS } from "../../../../.storybook/mockData";
import {
  auditLogFactory,
  beoordelaarFactory,
  coReviewFactory,
  destructionListAssigneeFactory,
  destructionListFactory,
  internalZaaktypeChoicesFactory,
  paginatedDestructionListItemsFactory,
  reviewFactory,
  roleFactory,
  userFactory,
  zaakFactory,
} from "../../../fixtures";
import { DestructionListReviewPage } from "./DestructionListReview";
import { destructionListReviewAction } from "./DestructionListReview.action";
import { destructionListReviewLoader } from "./DestructionListReview.loader";

const REVIEWER = destructionListAssigneeFactory({
  role: "main_reviewer",
  user: userFactory({
    pk: 2,
    username: "reviewer",
    firstName: "Revie",
    lastName: "Wer",
    role: roleFactory({
      canReviewDestruction: true,
      canCoReviewDestruction: true,
    }),
  }),
});

const CO_REVIEWER = destructionListAssigneeFactory({
  role: "co_reviewer",
  user: userFactory({
    pk: 3,
    username: "co-reviewer",
    firstName: "Co",
    lastName: "Reviewer",
    role: roleFactory({
      canReviewDestruction: false,
      canCoReviewDestruction: true,
    }),
  }),
});

const DESTRUCTION_LIST = destructionListFactory({
  uuid: "00000000-0000-0000-0000-000000000000",
  status: "ready_to_review",
  assignee: REVIEWER.user,
  assignees: [
    destructionListAssigneeFactory({ role: "author" }),
    REVIEWER,
    CO_REVIEWER,
  ],
});

/**
 * Removes items from sessionStorage with keys starting with "oab.".
 * Logs the removal of each item to the console.
 *
 * This complements `ClearSessionStorageDecorator`.
 */
function cleanUp() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith("oab."))
    .forEach((key) => {
      console.info(
        `destructionListReview.stories.tsx.meta: removing item "${key}"`,
      );
      sessionStorage.removeItem(key);
    });
}

const meta: Meta<typeof DestructionListReviewPage> = {
  title: "Pages/DestructionList/DestructionListReviewPage",
  component: DestructionListReviewPage,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:review",
        loader: destructionListReviewLoader,
        action: destructionListReviewAction,
      },
      params: {
        uuid: "00000000-0000-0000-0000-000000000000",
      },
    },
    mockData: [
      MOCKS.DESTRUCTION_LIST_BEHANDELEND_AFDELING_CHOICES,
      MOCKS.DESTRUCTION_LIST_RESULTAATTYPE_CHOICES,
      MOCKS.OIDC_INFO,
      MOCKS.ZAAKTYPE_CHOICES_POST,
      MOCKS.ZAAKTYPE_CHOICES,
      MOCKS.INTERNAL_SELECTIE_LIJST_CHOICES,
      MOCKS.REVIEWERS,
      MOCKS.CO_REVIEWS,
      MOCKS.CO_REVIEWERS,
      MOCKS.HEALTH_CHECK,
      {
        url: "http://localhost:8000/api/v1/destruction-list-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000&ordering=-created",
        method: "GET",
        status: 200,
        response: reviewFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/?",
        method: "GET",
        status: 200,
        response: DESTRUCTION_LIST,
      },
      {
        url: "http://localhost:8000/api/v1/logs/?destruction_list=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: auditLogFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-items/?item-destruction_list=00000000-0000-0000-0000-000000000000&item-status=suggested&item-order_review_ignored=true&viewMode=story&id=pages-destructionlist-destructionlistreviewpage--reviewer-can-approve-zaak&destruction_list=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: paginatedDestructionListItemsFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/users?role=main_reviewer",
        method: "GET",
        status: 200,
        response: [beoordelaarFactory()],
      },
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: REVIEWER.user,
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/?",
        method: "GET",
        status: 200,
        response: [
          beoordelaarFactory({
            role: roleFactory({ canCoReviewDestruction: true }),
          }),
        ],
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/select-all/?",
        method: "GET",
        status: 200,
        response: {
          allSelected: false,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/count/?",
        method: "GET",
        status: 200,
        response: {
          count: 0,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "POST",
        status: 200,
        response: {
          [zaakFactory().url]: {
            selected: true,
            detail: { approved: true, comment: "test" },
          },
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "PATCH",
        status: 200,
        response: {
          [zaakFactory().url]: {
            selected: true,
            detail: { approved: true, comment: "test" },
          },
        },
      },
    ],
  },
  beforeEach: cleanUp,
  afterEach: cleanUp,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReviewerCanApproveZaak: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const approves = await canvas.findAllByRole("button", {
      name: "Accorderen",
    });
    const approve = approves[0];
    await userEvent.click(approve);
    // Find all checkboxes
    const checkboxes = await canvas.findAllByRole("checkbox");
    const checkbox = checkboxes[0];
    await expect(checkbox).toBeChecked();
  },
};

export const ReviewerCanExcludeZaak: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const excludes = await canvas.findAllByRole("button", {
      name: "Uitzonderen",
    });
    const exclude = excludes[0];
    await userEvent.click(exclude, { delay: 60 });

    const reason = await canvas.findByLabelText("Reden");
    const submitExclude = await canvas.findByRole("button", {
      name: "Zaak uitzonderen",
    });
    await userEvent.type(reason, "reden", { delay: 10, skipClick: false });
    await expect(submitExclude).toBeEnabled();
    await userEvent.click(submitExclude);
  },
};

export const ReviewerCanApproveDestructionList: Story = {
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-list-reviews/?",
        method: "POST",
        status: 201,
        response: reviewFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "DELETE",
        status: 200,
        response: {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const approve = await canvas.findByText("Goedkeuren");
    await expect(approve).toBeInTheDocument();
    await userEvent.click(approve);
    const comment = await canvas.getByLabelText("Opmerking");
    const submit = await canvas.getByRole("button", {
      name: "Vernietigingslijst goedkeuren",
    });
    await userEvent.type(comment, "Comment", { delay: 10, skipClick: false });
    await userEvent.click(submit);
  },
};

export const ApproveDestructionListErrorShowsErrorMessage: Story = {
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-list-reviews/?",
        method: "POST",
        status: 500,
        response: { detail: "example" },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "DELETE",
        status: 200,
        response: {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const approve = await canvas.findByText("Goedkeuren");
    await expect(approve).toBeInTheDocument();
    await userEvent.click(approve);
    const comment = await canvas.getByLabelText("Opmerking");
    const submit = await canvas.getByRole("button", {
      name: "Vernietigingslijst goedkeuren",
    });
    await userEvent.type(comment, "Comment", { delay: 10, skipClick: false });
    await userEvent.click(submit);
    await expect(await canvas.findByText("example")).toBeInTheDocument();
  },
};

export const ReviewerCanRejectDestructionList: Story = {
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/count?",
        method: "GET",
        status: 200,
        response: {
          count: 1,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/select-all?",
        method: "GET",
        status: 200,
        response: {
          allSelected: false,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?items=http%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F87691e74-1b0b-491a-aa63-0a396bbb1e3e%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F3038cc8e-003b-411c-b6ef-7dc5ddc5a3ee%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F78b6dd10-261b-4a40-99e2-1eea3e38bc99%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F64bec25d-5752-48a9-b2f9-6c27085a469f%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F409a291a-9cf0-4c40-9f31-25e9452a8e79%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F1188687c-392b-439e-9d5f-4d17bac822bf%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F5d816422-7f1c-42b4-9a4c-715d2e07aca3%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2e803c71-49c4-4dc0-bfd1-42f2a3da99f9%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2Fbd6cdd85-d578-47fa-9ddb-846354088a47%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2ca5f28c-397b-4cc6-ac76-4ef6cab19f59",
        method: "POST",
        status: 200,
        response: {
          "https://test.openzaak.nl/zaken/api/v1/zaken/87691e74-1b0b-491a-aa63-0a396bbb1e3e":
            {
              detail: {
                comment: "BLA",
                approved: false,
              },
              selected: true,
            },
        },
      },

      {
        url: "http://localhost:8000/api/v1/destruction-list-reviews/?",
        method: "POST",
        status: 201,
        response: reviewFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "DELETE",
        status: 200,
        response: {},
      },
      ...(meta.parameters?.mockData || []),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reject = await canvas.findByText("Afwijzen");
    await expect(reject).toBeInTheDocument();
    await userEvent.click(reject);
    const reason = await canvas.getByLabelText("Reden");
    const submit = await canvas.getByRole("button", {
      name: "Vernietigingslijst afwijzen",
    });
    await userEvent.type(reason, "Reden", { delay: 10, skipClick: false });
    await userEvent.click(submit);
  },
};

export const RejectDestructionListErrorShowsErrorMessage: Story = {
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/count?",
        method: "GET",
        status: 200,
        response: {
          count: 1,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/select-all?",
        method: "GET",
        status: 200,
        response: {
          allSelected: false,
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?items=http%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F87691e74-1b0b-491a-aa63-0a396bbb1e3e%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F3038cc8e-003b-411c-b6ef-7dc5ddc5a3ee%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F78b6dd10-261b-4a40-99e2-1eea3e38bc99%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F64bec25d-5752-48a9-b2f9-6c27085a469f%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F409a291a-9cf0-4c40-9f31-25e9452a8e79%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F1188687c-392b-439e-9d5f-4d17bac822bf%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F5d816422-7f1c-42b4-9a4c-715d2e07aca3%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2e803c71-49c4-4dc0-bfd1-42f2a3da99f9%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2Fbd6cdd85-d578-47fa-9ddb-846354088a47%2Chttp%3A%2F%2Flocalhost%3A8000%2Fzaken%2Fapi%2Fv1%2Fzaken%2F2ca5f28c-397b-4cc6-ac76-4ef6cab19f59",
        method: "POST",
        status: 200,
        response: {
          "https://test.openzaak.nl/zaken/api/v1/zaken/87691e74-1b0b-491a-aa63-0a396bbb1e3e":
            {
              detail: {
                comment: "BLA",
                approved: false,
              },
              selected: true,
            },
        },
      },

      {
        url: "http://localhost:8000/api/v1/destruction-list-reviews/?",
        method: "POST",
        status: 500,
        response: { detail: "example" },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "DELETE",
        status: 200,
        response: {},
      },
      ...(meta.parameters?.mockData || []),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reject = await canvas.findByText("Afwijzen");
    await expect(reject).toBeInTheDocument();
    await userEvent.click(reject);
    const reason = await canvas.getByLabelText("Reden");
    const submit = await canvas.getByRole("button", {
      name: "Vernietigingslijst afwijzen",
    });
    await userEvent.type(reason, "Reden", { delay: 10, skipClick: false });
    await userEvent.click(submit);
    await expect(await canvas.findByText("example")).toBeInTheDocument();
  },
};

export const CoReviewerCanCompleteCoReview: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: destructionListReviewLoader,
        action: destructionListReviewAction,
      },
    },
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: userFactory({
          pk: 3,
          username: "co-reviewer",
          firstName: "Co",
          lastName: "Reviewer",
          role: roleFactory({
            canReviewDestruction: false,
            canCoReviewDestruction: true,
          }),
        }),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?",
        method: "POST",
        status: 201,
        response: coReviewFactory(),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const approve = await canvas.findByText("Medebeoordeling afronden");
    await expect(approve).toBeInTheDocument();
    await userEvent.click(approve);
    const dialog = await canvas.findByRole("dialog");
    const comment = await within(dialog).getByLabelText("Opmerking");
    const submit = await within(dialog).getByRole("button", {
      name: "Medebeoordeling afronden",
    });
    await userEvent.type(comment, "Comment", { delay: 10, skipClick: false });
    await userEvent.click(submit);
  },
};

export const CompleteCoReviewErrorShowsErrorMessage: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: destructionListReviewLoader,
        action: destructionListReviewAction,
      },
    },
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: userFactory({
          pk: 3,
          username: "co-reviewer",
          firstName: "Co",
          lastName: "Reviewer",
          role: roleFactory({
            canReviewDestruction: false,
            canCoReviewDestruction: true,
          }),
        }),
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?",
        method: "POST",
        status: 500,
        response: { detail: "example" },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const approve = await canvas.findByText("Medebeoordeling afronden");
    await expect(approve).toBeInTheDocument();
    await userEvent.click(approve);
    const dialog = await canvas.findByRole("dialog");
    const comment = await within(dialog).getByLabelText("Opmerking");
    const submit = await within(dialog).getByRole("button", {
      name: "Medebeoordeling afronden",
    });
    await userEvent.type(comment, "Comment", { delay: 10, skipClick: false });
    await userEvent.click(submit);
    await expect(await canvas.findByText("example")).toBeInTheDocument();
  },
};

export const PollExternalChanges: Story = {
  parameters: {
    mockData: [
      ...(meta?.parameters?.mockData || []),
      MOCKS.HEALTH_CHECK,
      MOCKS.SELECTIE_LIJST_CHOICES,
      MOCKS.CO_REVIEWS,
      MOCKS.OIDC_INFO,
      {
        url: "http://localhost:8000/api/v1/_zaaktypen-choices/",
        method: "POST",
        status: 200,
        response: internalZaaktypeChoicesFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "POST",
        status: 200,
        response: {
          [zaakFactory().url]: {
            selected: true,
            detail: { approved: false, comment: "test" },
          },
        },
      },
      {
        url: "http://localhost:8000/api/v1/selections/destruction-list-review-00000000-0000-0000-0000-000000000000-ready_to_review/?",
        method: "PATCH",
        status: 200,
        response: {
          [zaakFactory().url]: {
            selected: true,
            detail: { approved: true, comment: "test" },
          },
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const approveButton = await canvas.findByRole("button", {
      name: "Accorderen",
    });
    await userEvent.click(approveButton, { delay: 10 });
    await waitFor(
      async () =>
        expect(canvas.queryByText("Uitgezonderd")).toBeInTheDocument(),
      { timeout: 5000 },
    );
  },
};
