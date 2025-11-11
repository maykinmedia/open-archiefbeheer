import { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { MOCKS, MOCK_BASE } from "../../../.storybook/mockData";
import { recordManagerFactory } from "../../fixtures/user";
import { Landing } from "./Landing";
import { landingLoader } from "./Landing.loader";

const meta: Meta<typeof Landing> = {
  title: "Pages/Landing",
  component: Landing,
  decorators: [ClearSessionStorageDecorator, ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: landingLoader,
      },
    },
  },
};

export default meta;

export const LandingPage: StoryObj<typeof Landing> = {
  parameters: {
    mockData: [
      ...MOCK_BASE,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const activeNames = MOCKS.DESTRUCTION_LISTS.response
      .filter((d) => d.status !== "deleted")
      .map((d) => d.name);
    for (const name of activeNames) {
      within(canvasElement).findByText(name);
      const button = await within(canvasElement).findByTitle(name);
      expect(button).not.toBeDisabled();
    }

    const destroyedNames = MOCKS.DESTRUCTION_LISTS.response
      .filter((d) => d.status === "deleted")
      .filter((d) => d.processingStatus === "succeeded")
      .map((d) => d.name);
    for (const name of destroyedNames) {
      const button = await within(canvasElement).findByTitle(name);
      expect(button).toHaveAttribute(
        "href",
        "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/download_report",
      );
    }
    const searchInput = await within(canvasElement).findByTitle("Zoeken");
    expect(searchInput).toBeInTheDocument();
    await userEvent.type(searchInput, "test");
    searchInput.blur();

    const button = await within(canvasElement).findByText(
      "Vernietigingslijst opstellen",
    );
    await userEvent.click(button);
  },
};
