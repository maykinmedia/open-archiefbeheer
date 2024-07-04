import { ReactRenderer } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PlayFunction } from "@storybook/types";

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
