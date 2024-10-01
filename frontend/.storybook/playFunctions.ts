import { Parameters, ReactRenderer } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PlayFunction } from "@storybook/types";

//
// Assertions
//

/**
 * Selects and deselects the "Identificatie" column and asserts whether it's shown/hidden based on the selected state.
 * @param canvasElement
 */
export const assertCheckboxSelection: PlayFunction<ReactRenderer> = async ({
  canvasElement,
  parameters,
}) => {
  const canvas = within(canvasElement);

  // Get checkboxes.
  const rowGroups = await canvas.findAllByRole("rowgroup");
  const tbody = rowGroups.find((rg) => {
    return rg.tagName === "TBODY";
  }) as HTMLTableSectionElement;
  const checkboxes =
    await within(tbody).findAllByRole<HTMLInputElement>("checkbox");

  await waitFor(() => new Promise((resolve) => setTimeout(resolve)));

  // Normalize state.
  for (const checkbox of checkboxes) {
    if (checkbox.checked) {
      await userEvent.click(checkbox, { delay: 10 });
    }
  }

  // Check if all (are/remain) unchecked.
  for (const checkbox of checkboxes) {
    expect(checkbox).not.toBeChecked();
  }

  // One by one check every checkbox.
  for (const checkbox of checkboxes) {
    await userEvent.click(checkbox, { delay: 10 });
  }

  // Check if all (are/remain) checked.
  for (const checkbox of checkboxes) {
    expect(checkbox).toBeChecked();
  }

  // Stop if forwards direction is used.
  if (parameters?.direction === "forwards") {
    return;
  }

  // One by one uncheck every checkbox.
  for (const checkbox of checkboxes) {
    await userEvent.click(checkbox, { delay: 10 });
  }

  // Check if all (are/remain) unchecked.
  for (const checkbox of checkboxes) {
    expect(checkbox).not.toBeChecked();
  }
};

/**
 * Selects and deselects the "Identificatie" column and asserts whether it's shown/hidden based on the selected state.
 * @param canvasElement
 */
export const assertColumnSelection: PlayFunction<ReactRenderer> = async ({
  canvasElement,
}) => {
  const canvas = within(canvasElement);

  // Get grid and "Select columns" button.
  const grid = await canvas.findByRole("grid");
  const selectColumnsButton = await canvas.findByRole<HTMLButtonElement>(
    "button",
    {
      name: "Select columns",
    },
  );

  // Modal should not be present at this time.
  expect(within(grid).queryByRole("dialog")).toBeNull();

  // Modal should when "Select columns" is clicked.
  await userEvent.click(selectColumnsButton, { delay: 100 });
  const modal = await canvas.findByRole("dialog");
  await expect(modal).toBeVisible();

  // Get "Identificatie" checkbox in modal.
  const identificatieCheckbox =
    within(modal).getByLabelText<HTMLInputElement>("Identificatie");
  const saveColumnSelection = await within(modal).findByRole<HTMLButtonElement>(
    "button",
    {
      name: "Save column selection",
    },
  );

  // Normalize state.
  if (!identificatieCheckbox.checked) {
    await userEvent.click(identificatieCheckbox);
    await userEvent.click(saveColumnSelection);
    await userEvent.click(selectColumnsButton);
  }

  // Expect the "Identificatie" column to be visible.
  const identificatieColumnHeader = await canvas.findByRole("columnheader", {
    name: "Identificatie",
  });
  expect(identificatieColumnHeader).toBeVisible();

  // Unselecting the column and saving should hide the "Identificatie" column.
  await userEvent.click(identificatieCheckbox, { delay: 100 });
  await userEvent.click(saveColumnSelection, { delay: 100 });
  expect(identificatieColumnHeader).not.toBeVisible();

  // Unselecting the column and saving should show the "Identificatie" column.
  await userEvent.click(selectColumnsButton, { delay: 100 });
  await userEvent.click(identificatieCheckbox, { delay: 100 });
  await userEvent.click(saveColumnSelection, { delay: 100 });
  // Re-fetch node.
  const identificatieColumn2 = await canvas.findByRole("columnheader", {
    name: "Identificatie",
  });
  expect(identificatieColumn2).toBeVisible();
};

//
// Utils
//

type ClickElementParameters = Parameters & {
  checked?: boolean;
  elementIndex?: number;
  inTBody?: boolean;
  role?: string;
  name?: string;
};

/**
 * Clicks button at position `elementIndex`, within <tbody> if `inTbody` is truthy.
 * @param context
 */
export const clickButton: PlayFunction<ReactRenderer> = async (context) => {
  await clickElement({
    ...context,
    parameters: {
      ...context.parameters,
      role: "button",
    },
  });
};

/**
 * Clicks checkbox at position `elementIndex`, within <tbody> if `inTbody` is truthy.
 * @param context
 */
export const clickCheckbox: PlayFunction<ReactRenderer> = async (context) => {
  await clickElement({
    ...context,
    parameters: {
      ...context.parameters,
      role: "checkbox",
    },
  });
};

/**
 * Clicks element at position `elementIndex`, within <tbody> if `inTbody` is truthy.
 * @param context
 */
export const clickElement: PlayFunction<ReactRenderer> = async (context) => {
  const {
    checked,
    elementIndex = 0,
    inTBody = false,
    role,
    name,
  } = context.parameters as ClickElementParameters;

  console.assert(
    role,
    'clickElement requires an element role be set using the "role" parameter!',
  );

  const canvas = within(context.canvasElement);
  const rowGroups = await canvas.findAllByRole("rowgroup");

  const tbody = rowGroups.find((rg) => {
    return rg.tagName === "TBODY";
  }) as HTMLTableSectionElement;

  const elements = await within(
    inTBody ? tbody : context.canvasElement,
    // @ts-expect-error - role now set.
  ).findAllByRole(role, { name });

  const element = elements[elementIndex];

  const checkedState = (element as HTMLInputElement).checked;

  // Normalize state.
  if (typeof checked !== "undefined" && checked === checkedState) {
    await userEvent.click(element, { delay: 10 });
  }

  await userEvent.click(element, { delay: 10 });
};

type FillFormParameters = Parameters & {
  form?: HTMLFormElement;
  formValues?: Record<string, boolean | string>;
  submitForm?: boolean;
};

/**
 * Fills in `form` with `formValues`, then submits if `submitForm` is truthy.
 * @param context
 */
export const fillForm: PlayFunction<ReactRenderer> = async (context) => {
  const canvas = within(context.canvasElement);

  const {
    form = await canvas.findByRole("form"),
    formValues = {},
    submitForm = true,
  } = context.parameters as FillFormParameters;

  for (const [name, value] of Object.entries(formValues)) {
    const field: HTMLInputElement | HTMLSelectElement =
      await within(form).findByLabelText(name);

    switch (typeof value) {
      case "boolean":
        const checkbox = field as HTMLInputElement;
        if (checkbox.checked !== value) {
          await userEvent.click(checkbox, { delay: 100 });
        }
        break;
      case "string":
        if ((field as HTMLSelectElement).options) {
          const select = field as HTMLSelectElement;
          await userEvent.click(select, { delay: 100 });
          const option = (await within(form).findAllByText(value))[0];
          await userEvent.click(option, { delay: 100 });
        } else {
          const input = field as HTMLInputElement;
          await userEvent.type(input, value, { delay: 10 });
        }
    }
  }

  if (submitForm) {
    const buttons = await within(form).findAllByRole("button");
    // Assume that last button is submit.
    const submit = buttons[buttons.length - 1];
    await userEvent.click(submit, { delay: 100 });
  }
};

type FillConfirmationFormParameters = ClickElementParameters &
  FillFormParameters;

/**
 * Clicks element at position `elementIndex`, within <tbody> if `inTbody` is truthy.
 * Then fills in dialog form, submits if `submitForm` is truthy.
 * @param context
 */
export const fillButtonConfirmationForm: PlayFunction<ReactRenderer> = async (
  context,
) => {
  await fillConfirmationForm({
    ...context,
    parameters: { ...context.parameters, role: "button" },
  });
};

/**
 * Clicks element at position `elementIndex`, within <tbody> if `inTbody` is truthy.
 * Then fills in dialog form, submits if `submitForm` is truthy.
 * @param context
 */
export const fillConfirmationForm: PlayFunction<ReactRenderer> = async (
  context,
) => {
  const parameters = context.parameters as FillConfirmationFormParameters;
  const _context = { ...context, parameters };
  await clickElement(_context);

  const canvas = within(context.canvasElement);
  const modal = await canvas.findByRole("dialog");
  // FIXME: Fix in admin-ui form should be picked up by role.
  // const form = await within(modal).findByRole("form", {}, { timeout: 3000 });

  await fillForm({
    ..._context,
    parameters: {
      ...parameters,
      form: modal,
    },
  });
};
