import { Meta, ReactRenderer, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PlayFunction } from "@storybook/types";
import { createMock, getMock } from "storybook-addon-module-mock";

import { ReactRouterDecorator } from "../../../.storybook/decorators";
import { fillForm } from "../../../.storybook/playFunctions";
import {
  destructionListAssigneeFactory,
  destructionListFactory,
} from "../../fixtures/destructionList";
import {
  beoordelaarFactory,
  procesEigenaarFactory,
  recordManagerFactory,
  userFactory,
} from "../../fixtures/user";
import * as libDestructionList from "../../lib/api/destructionLists";
import { updateCoReviewers } from "../../lib/api/destructionLists";
import { DestructionListEditPage } from "../../pages";
import { DestructionListReviewer as DestructionListReviewerComponent } from "./DestructionListReviewer";

const meta: Meta<typeof DestructionListEditPage> = {
  title: "Components/DestructionListReviewer",
  component: DestructionListReviewerComponent,
  decorators: [ReactRouterDecorator],
  parameters: {
    moduleMock: {
      mock: () => {
        const reassignDestructionList = createMock(
          libDestructionList,
          "reassignDestructionList",
        );
        reassignDestructionList.mockImplementation(
          async () => ({}) as Response,
        );

        const updateCoReviewers = createMock(
          libDestructionList,
          "updateCoReviewers",
        );
        updateCoReviewers.mockImplementation(async () => ({}) as Response);

        return [reassignDestructionList, updateCoReviewers];
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type PlayFunctionWithReturnValue<T = unknown> = (
  ...args: Parameters<PlayFunction<ReactRenderer>>
) => Promise<T>;

const RECORD_MANAGER = recordManagerFactory({ pk: 0 });
const REVIEWER1 = beoordelaarFactory({ pk: 1 });
const REVIEWER2 = beoordelaarFactory({
  pk: 2,
  username: "Beoor del Laar 2",
  firstName: "Beoor",
  lastName: "del Laar 2",
  email: "beoordelaar2@example.com",
});
const REVIEWER3 = procesEigenaarFactory({ pk: 3 });

const DESTRUCTION_LIST_NEW = destructionListFactory({
  author: RECORD_MANAGER,
  status: "new",
});

const DESTRUCTION_LIST_READY_TO_REVIEW = destructionListFactory({
  author: RECORD_MANAGER,
  status: "ready_to_review",
  assignee: REVIEWER1,
});

/**
 * Play function that asserts whether the edit button is shown.
 */
const assertEditButton: PlayFunctionWithReturnValue<
  HTMLButtonElement | null
> = async ({ canvasElement, parameters: { shouldBeVisible = true } }) => {
  sessionStorage.removeItem("oab.lib.cache.listReviewers");
  sessionStorage.removeItem("oab.lib.cache.whoAmI");

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

/**
 * Play function that asserts whether reviewer can be updated.
 */
const assertEditReviewer: PlayFunction<ReactRenderer> = async (context) => {
  sessionStorage.removeItem("oab.lib.cache.listReviewers");
  sessionStorage.removeItem("oab.lib.cache.whoAmI");

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
      form: form,
      formValues: {
        Beoordelaar: "Proces ei Genaar (Proces ei Genaar)",
        Reden: "Edit reviewer",
      },
      submitForm: true,
    },
  });
  await waitFor(() => {
    const reassignDestructionList = getMock(
      context.parameters,
      libDestructionList,
      "reassignDestructionList",
    );
    expect(reassignDestructionList).toHaveBeenCalledOnce();
    expect(updateCoReviewers).not.toHaveBeenCalled();
  });
};

/**
 * Play function that asserts whether reviewer can be updated.
 */
const assertEditCoReviewers: PlayFunction<ReactRenderer> = async (context) => {
  sessionStorage.removeItem("oab.lib.cache.listReviewers");
  sessionStorage.removeItem("oab.lib.cache.whoAmI");

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
      form: form,
      formValues: {
        "Medebeoordelaar 2": "Proces ei Genaar (Proces ei Genaar)",
        Reden: "Edit co-reviewers",
      },
      submitForm: true,
    },
  });

  await expect(coReviewer2.value).toBe(REVIEWER3.pk.toString());

  await waitFor(() => {
    const reassignDestructionList = getMock(
      context.parameters,
      libDestructionList,
      "reassignDestructionList",
    );
    expect(reassignDestructionList).toHaveBeenCalledOnce();

    const updateCoReviewers = getMock(
      context.parameters,
      libDestructionList,
      "updateCoReviewers",
    );
    expect(updateCoReviewers).toHaveBeenCalledOnce();
  });
};

export const UserCannotReassignReviewer: Story = {
  args: { destructionList: destructionListFactory({ author: RECORD_MANAGER }) },
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/oidc-info?",
        method: "GET",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/whoami",
        method: "GET",
        status: 200,
        response: userFactory(),
      },
      {
        url: "http://localhost:8000/api/v1/reviewers/?",
        method: "GET",
        status: 200,
        response: [REVIEWER1, REVIEWER2, REVIEWER3],
      },
      {
        url: `http://localhost:8000/api/v1/destruction-lists/${DESTRUCTION_LIST_READY_TO_REVIEW.uuid}/co-reviewers/?`,
        method: "GET",
        status: 200,
        response: [
          destructionListAssigneeFactory({
            user: beoordelaarFactory({
              username: "Beoor del Laar 2",
              firstName: "Beoor",
              lastName: "del Laar 2",
              email: "beoordelaar2@example.com",
            }),
            role: "co_reviewer",
          }),
        ],
      },
    ],
  },
  play: async (context) => {
    assertEditButton({ ...context, parameters: { shouldBeVisible: false } });
  },
};

export const RecordManagerCanReassignReviewer: Story = {
  args: { destructionList: DESTRUCTION_LIST_NEW },
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/oidc-info?",
        method: "GET",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/whoami",
        method: "GET",
        status: 200,
        response: RECORD_MANAGER,
      },
      {
        url: "http://localhost:8000/api/v1/reviewers/?",
        method: "GET",
        status: 200,
        response: [REVIEWER1, REVIEWER2, REVIEWER3],
      },
      {
        url: `http://localhost:8000/api/v1/destruction-lists/${DESTRUCTION_LIST_READY_TO_REVIEW.uuid}/co-reviewers/?`,
        method: "GET",
        status: 200,
        response: [
          {
            user: REVIEWER2,
            role: "co_reviewer",
          },
        ],
      },
    ],
  },
  play: async (context) => {
    await assertEditReviewer(context);
  },
};

export const ReviewerCanReassignCoReviewers: Story = {
  args: { destructionList: DESTRUCTION_LIST_READY_TO_REVIEW },
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/oidc-info?",
        method: "GET",
        status: 200,
        response: {},
      },
      {
        url: "http://localhost:8000/api/v1/whoami",
        method: "GET",
        status: 200,
        response: REVIEWER1,
      },
      {
        url: "http://localhost:8000/api/v1/reviewers/?",
        method: "GET",
        status: 200,
        response: [REVIEWER1, REVIEWER2, REVIEWER3],
      },
      {
        url: `http://localhost:8000/api/v1/destruction-lists/${DESTRUCTION_LIST_READY_TO_REVIEW.uuid}/co-reviewers/?`,
        method: "GET",
        status: 200,
        response: [
          {
            user: REVIEWER2,
            role: "co_reviewer",
          },
        ],
      },
    ],
  },
  play: async (context) => {
    await assertEditCoReviewers(context);
  },
};
