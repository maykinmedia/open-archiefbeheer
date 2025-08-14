import { Meta, ReactRenderer, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { PlayFunction } from "storybook/internal/types";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { MOCKS } from "../../../.storybook/mockData";
import { clickButton, fillForm } from "../../../.storybook/playFunctions";
import { coReviewFactory } from "../../fixtures";
import { destructionListFactory } from "../../fixtures/destructionList";
import {
  beoordelaarFactory,
  procesEigenaarFactory,
  recordManagerFactory,
  roleFactory,
} from "../../fixtures/user";
import { DestructionListReviewer as DestructionListReviewerComponent } from "./DestructionListReviewer";

const RECORD_MANAGER = recordManagerFactory({ pk: 1, username: "Foo" });
const REVIEWER1 = beoordelaarFactory({ pk: 2 });
const REVIEWER2 = beoordelaarFactory({
  pk: 3,
  username: "Beoor del Laar 2",
  firstName: "Beoor",
  lastName: "del Laar 2",
  email: "beoordelaar2@example.com",
});
const REVIEWER3 = procesEigenaarFactory({ pk: 4 });
const REVIEWER4 = beoordelaarFactory({
  pk: 5,
  username: "co-reviewer",
  firstName: "Co",
  lastName: "Reviewer",
  role: roleFactory({
    canReviewDestruction: false,
    canCoReviewDestruction: true,
  }),
});

const DESTRUCTION_LIST_NEW = destructionListFactory({
  author: RECORD_MANAGER,
  status: "new",
});

const DESTRUCTION_LIST_READY_TO_REVIEW = destructionListFactory({
  author: RECORD_MANAGER,
  status: "ready_to_review",
  assignee: REVIEWER1,
});

const meta: Meta<typeof DestructionListReviewerComponent> = {
  title: "Components/DestructionListReviewer",
  component: DestructionListReviewerComponent,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    mockData: [
      MOCKS.HEALTH_CHECK,
      MOCKS.CO_REVIEWS,
      MOCKS.REVIEWERS,
      MOCKS.DESTRUCTION_LIST_CO_REVIEWERS,
      MOCKS.OIDC_INFO,
      MOCKS.INTERNAL_SELECTIE_LIJST_CHOICES,
      {
        url: "http://localhost:8000/api/v1/users?role=co_reviewer",
        method: "GET",
        status: 200,
        response: [REVIEWER1, REVIEWER2, REVIEWER3, REVIEWER4],
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
        method: "GET",
        status: 200,
        response: [
          {
            user: REVIEWER2,
            role: "co_reviewer",
          },
        ],
      },
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type PlayFunctionWithReturnValue<T = unknown> = (
  ...args: Parameters<PlayFunction<ReactRenderer>>
) => Promise<T>;

/**
 * Play function that asserts whether the edit button is shown.
 */
const assertEditButton: PlayFunctionWithReturnValue<
  HTMLButtonElement | null
> = async ({ canvasElement, parameters: { shouldBeVisible = true } }) => {
  const canvas = within(canvasElement);
  // Allow the button to appear.
  await new Promise((resolve) => setTimeout(resolve, 600));
  const editButton = canvas.queryByRole<HTMLButtonElement>("button", {
    name: "Beoordelaar bewerken",
  });
  if (shouldBeVisible) {
    await expect(editButton).toBeInTheDocument();
  } else {
    await expect(editButton).not.toBeInTheDocument();
  }

  return editButton;
};

export const UserCannotReassignReviewer: Story = {
  args: {
    destructionList: destructionListFactory({
      author: RECORD_MANAGER,
      status: "internally_reviewed",
    }),
  },
  play: async (context) => {
    await assertEditButton({
      ...context,
      parameters: { ...meta.parameters, shouldBeVisible: false },
    });
  },
};

export const RecordManagerCanReassignReviewer: Story = {
  args: { destructionList: DESTRUCTION_LIST_NEW },
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/reassign/",
        method: "POST",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
        method: "PUT",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
    ],
  },
  play: async (context) => {
    const editButton = (await assertEditButton({
      ...context,
      parameters: { shouldBeVisible: true },
    })) as HTMLButtonElement;
    await userEvent.click(editButton);

    const dialog = await within(context.canvasElement).findByRole("dialog");
    // fixme: admin-ui dialog forms are not considered to be accessible due to no aria-label.
    const form = dialog.querySelector("form");

    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          form: form,
          formValues: {
            Beoordelaar: "Proces ei Genaar (Proces ei Genaar)",
            Reden: "Edit reviewer",
          },
          submitForm: true,
        },
      },
    });
  },
};

export const RecordManagerCanReassignCoReviewers: Story = {
  args: { destructionList: DESTRUCTION_LIST_READY_TO_REVIEW },
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
    ],
  },
  play: async (context) => {
    const editButton = (await assertEditButton({
      ...context,
      parameters: { shouldBeVisible: true },
    })) as HTMLButtonElement;
    await userEvent.click(editButton);

    const dialog = await within(context.canvasElement).findByRole("dialog");
    // fixme: admin-ui dialog forms are not considered to be accessible due to no aria-label.
    const form = dialog.querySelector("form");
    const coReviewer1: HTMLInputElement = within(
      form as HTMLFormElement,
    ).getByLabelText("Medebeoordelaar 1");
    const coReviewer2: HTMLInputElement = within(
      form as HTMLFormElement,
    ).getByLabelText("Medebeoordelaar 2");

    await expect(coReviewer1.value).toBe(REVIEWER2.pk.toString());

    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          form: form,
          formValues: {
            "Medebeoordelaar 2": "Co Reviewer (co-reviewer)",
            Reden: "Edit co-reviewers",
          },
          submitForm: true,
        },
      },
    });

    await expect(coReviewer2.value).toBe(REVIEWER4.pk.toString());
  },
};

export const ReviewerCanReassignCoReviewers: Story = {
  args: { destructionList: DESTRUCTION_LIST_READY_TO_REVIEW },
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: REVIEWER1,
      },
    ],
  },
  play: async (context) => {
    const editButton = (await assertEditButton({
      ...context,
      parameters: { shouldBeVisible: true },
    })) as HTMLButtonElement;
    await userEvent.click(editButton);

    const dialog = await within(context.canvasElement).findByRole("dialog");
    // fixme: admin-ui dialog forms are not considered to be accessible due to no aria-label.
    const form = dialog.querySelector("form");
    const coReviewer1: HTMLInputElement = within(
      form as HTMLFormElement,
    ).getByLabelText("Medebeoordelaar 1");
    const coReviewer2: HTMLInputElement = within(
      form as HTMLFormElement,
    ).getByLabelText("Medebeoordelaar 2");

    await expect(coReviewer1.value).toBe(REVIEWER2.pk.toString());

    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          form: form,
          formValues: {
            "Medebeoordelaar 2": "Co Reviewer (co-reviewer)",
            Reden: "Edit co-reviewers",
          },
          submitForm: true,
        },
      },
    });

    await expect(coReviewer2.value).toBe(REVIEWER4.pk.toString());
  },
};

export const CoReviewStatusVisible: Story = {
  args: { destructionList: DESTRUCTION_LIST_READY_TO_REVIEW },
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: [coReviewFactory({ author: REVIEWER2 })],
      },
    ],
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const element = await canvas.getByTitle(
      "Medebeoordelaar is klaar met beoordelen",
    );
    await expect(element).toBeVisible();
  },
};

export const UpdateCoReviewersErrorShowsErrorMessage: Story = {
  args: { destructionList: DESTRUCTION_LIST_READY_TO_REVIEW },
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: REVIEWER1,
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: [coReviewFactory({ author: REVIEWER2 })],
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
        method: "PUT",
        status: 400,
        response: {
          error:
            "Er is een fout opgetreden bij het bewerken van de mede beoordelaars!",
        },
      },
    ],
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const edit = canvas.getByRole("button", { name: "Beoordelaar bewerken" });
    await userEvent.click(edit);

    const reden = await canvas.findByLabelText("Reden");
    const submit = await canvas.findByRole("button", { name: "Toewijzen" });

    await userEvent.type(reden, "example", { delay: 10 });
    await userEvent.click(submit, { delay: 10 });

    await canvas.findByText(
      "Er is een fout opgetreden bij het bewerken van de mede beoordelaars!",
    );
  },
};

export const ReassignDestructionListErrorShowsErrorMessage: Story = {
  args: { destructionList: DESTRUCTION_LIST_READY_TO_REVIEW },
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
      {
        url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: [coReviewFactory({ author: REVIEWER2 })],
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/update_assignee/",
        method: "POST",
        status: 400,
        response: {
          error:
            "Er is een fout opgetreden bij het bewerken van de beoordelaar!",
        },
      },
      {
        url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
        method: "PUT",
        status: 400,
        response: {
          error:
            "Er is een fout opgetreden bij het bewerken van de mede beoordelaars!",
        },
      },
    ],
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const edit = canvas.getByRole("button", { name: "Beoordelaar bewerken" });
    await new Promise((resolve) => setTimeout(resolve));
    await userEvent.click(edit);

    const dialog = await canvas.findByRole("dialog");

    const beoordelaar = await canvas.findByLabelText("Beoordelaar*");
    await userEvent.click(beoordelaar, { delay: 10 });
    const options = await within(dialog).findAllByText(
      "Beoor del Laar 2 (Beoor del Laar 2)",
    );
    await userEvent.click(options[0], { delay: 10 });

    const reden = await canvas.findByLabelText("Reden");
    const submit = await canvas.findByRole("button", { name: "Toewijzen" });
    await userEvent.clear(reden); // Fixes a bug where input onChange isn't triggered when using userEvent.type
    await userEvent.type(reden, "example", { delay: 10 });
    await userEvent.click(submit, { delay: 10 });
    await canvas.findByText(
      "Er is een fout opgetreden bij het bewerken van de beoordelaar!",
    );
  },
};

export const ReopeningModalPreservesState: Story = {
  args: { destructionList: DESTRUCTION_LIST_NEW },
  parameters: {
    mockData: [
      ...(meta.parameters?.mockData || []),
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
    ],
  },
  play: async (context) => {
    await clickButton({
      ...context,
      parameters: {
        clickButton: {
          name: "Beoordelaar bewerken",
        },
      },
    });

    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          formValues: {
            Beoordelaar: "Proces ei Genaar (Proces ei Genaar)",
          },
          submitForm: false,
        },
      },
    });

    await expect(
      await within(context.canvasElement).findByRole("button", {
        name: "Toewijzen",
      }),
    ).toBeDisabled();

    await clickButton({
      ...context,
      parameters: {
        clickButton: {
          name: "Annuleren",
        },
      },
    });

    await clickButton({
      ...context,
      parameters: {
        clickButton: {
          name: "Beoordelaar bewerken",
        },
      },
    });

    await expect(
      await within(context.canvasElement).findByRole("button", {
        name: "Toewijzen",
      }),
    ).toBeDisabled();

    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          formValues: {
            Reden: "gh-636",
          },
          submitForm: false,
        },
      },
    });

    await clickButton({
      ...context,
      parameters: {
        clickButton: {
          name: "Annuleren",
        },
      },
    });

    await clickButton({
      ...context,
      parameters: {
        clickButton: {
          name: "Beoordelaar bewerken",
        },
      },
    });

    await expect(
      await within(context.canvasElement).findByLabelText("Reden"),
    ).toHaveValue("gh-636");

    await expect(
      await within(context.canvasElement).findByRole("button", {
        name: "Toewijzen",
      }),
    ).toBeEnabled();
  },
};
