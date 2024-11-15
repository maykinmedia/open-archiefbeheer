import { Meta, ReactRenderer, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PlayFunction } from "@storybook/types";
import { createMock, getMock } from "storybook-addon-module-mock";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { fillForm } from "../../../.storybook/playFunctions";
import { destructionListFactory } from "../../fixtures/destructionList";
import {
  beoordelaarFactory,
  procesEigenaarFactory,
  recordManagerFactory,
  roleFactory,
} from "../../fixtures/user";
import * as hooksUseWhoAmI from "../../hooks";
import * as libDestructionList from "../../lib/api/destructionLists";
import { updateCoReviewers } from "../../lib/api/destructionLists";
import { DestructionListEditPage } from "../../pages";
import { DestructionListReviewer as DestructionListReviewerComponent } from "./DestructionListReviewer";

const meta: Meta<typeof DestructionListEditPage> = {
  title: "Components/DestructionListReviewer",
  component: DestructionListReviewerComponent,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

type PlayFunctionWithReturnValue<T = unknown> = (
  ...args: Parameters<PlayFunction<ReactRenderer>>
) => Promise<T>;

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

/**
 * Play function that asserts whether reviewer can be updated.
 */
const assertEditReviewer: PlayFunction<ReactRenderer> = async (context) => {
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
        "Medebeoordelaar 2": "Co Reviewer (co-reviewer)",
        Reden: "Edit co-reviewers",
      },
      submitForm: true,
    },
  });

  await expect(coReviewer2.value).toBe(REVIEWER4.pk.toString());

  await waitFor(() => {
    const reassignDestructionList = getMock(
      context.parameters,
      libDestructionList,
      "reassignDestructionList",
    );
    expect(reassignDestructionList).not.toHaveBeenCalled();

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

        const useWhoAmI = createMock(hooksUseWhoAmI, "useWhoAmI");
        useWhoAmI.mockImplementation(() => RECORD_MANAGER);

        return [reassignDestructionList, updateCoReviewers, useWhoAmI];
      },
    },
  },
  play: async (context) => {
    await assertEditReviewer(context);
  },
};

export const ReviewerCanReassignCoReviewers: Story = {
  args: { destructionList: DESTRUCTION_LIST_READY_TO_REVIEW },
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

        const useWhoAmI = createMock(hooksUseWhoAmI, "useWhoAmI");
        useWhoAmI.mockImplementation(() => beoordelaarFactory());

        const useCoReviewers = createMock(hooksUseWhoAmI, "useCoReviewers");
        useCoReviewers.mockImplementation(() => [
          REVIEWER2,
          REVIEWER3,
          REVIEWER4,
        ]);

        const useDestructionListCoReviewers = createMock(
          hooksUseWhoAmI,
          "useDestructionListCoReviewers",
        );
        useDestructionListCoReviewers.mockImplementation(() => [
          { user: REVIEWER2, role: "co_reviewer" },
        ]);

        return [reassignDestructionList, updateCoReviewers, useWhoAmI];
      },
    },
  },
  play: async (context) => {
    await assertEditCoReviewers(context);
  },
};
