import { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  ClearSessionStorageDecorator,
  ReactRouterDecorator,
} from "../../../.storybook/decorators";
import { MOCKS } from "../../../.storybook/mockData";
import { recordManagerFactory } from "../../fixtures";
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
      MOCKS.HEALTH_CHECK,
      MOCKS.REVIEWERS,
      MOCKS.OIDC_INFO,
      {
        url: "http://localhost:8000/api/v1/whoami/",
        method: "GET",
        status: 200,
        response: recordManagerFactory(),
      },
      {
        url:
          "\n" +
          "http://localhost:8000/api/v1/destruction-lists/kanban/?viewMode=story&id=pages-landing--landing-page&globals=&ordering=-created",
        method: "GET",
        status: 200,
        response: {
          nieuw: MOCKS.DESTRUCTION_LISTS.response.filter(
            (d) => d.status === "new",
          ),
          "klaar voor beoordeling": MOCKS.DESTRUCTION_LISTS.response.filter(
            (d) => d.status === "ready_to_review",
          ),
          "wijzigingen aangevraagd": MOCKS.DESTRUCTION_LISTS.response.filter(
            (d) => d.status === "changes_requested",
          ),
          "intern beoordeeld": MOCKS.DESTRUCTION_LISTS.response.filter(
            (d) => d.status === "internally_reviewed",
          ),
          "klaar voor archivaris": MOCKS.DESTRUCTION_LISTS.response.filter(
            (d) => d.status === "ready_for_archivist",
          ),
          "klaar om te vernietigen": MOCKS.DESTRUCTION_LISTS.response.filter(
            (d) => d.status === "ready_to_delete",
          ),
          "recently destroyed": MOCKS.DESTRUCTION_LISTS.response.filter(
            (d) => d.status === "deleted",
          ),
        },
      },
      {
        url: "http://localhost:8000/api/v1/whoami",
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
