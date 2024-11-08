import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import { destructionListFactory } from "../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../fixtures/review";
import { usersFactory } from "../../../fixtures/user";
import {
  clearZaakSelection,
  getFilteredZaakSelection,
  getZaakSelectionItems,
} from "../../../lib/zaakSelection";
import {
  DestructionListReviewPage,
  getDestructionListReviewKey,
} from "./DestructionListReview";
import { destructionListReviewAction } from "./DestructionListReview.action";
import { DestructionListReviewContext } from "./DestructionListReview.loader";

const meta: Meta<typeof DestructionListReviewPage> = {
  title: "Pages/DestructionList/DestructionListReviewPage",
  component: DestructionListReviewPage,
  decorators: [ReactRouterDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE: DestructionListReviewContext = {
  storageKey: "storybook-storage-key",
  uuid: "00000000-0000-0000-0000-000000000000",
  destructionList: destructionListFactory(),
  logItems: [],
  review: reviewFactory(),
  reviewers: usersFactory(),
  paginatedZaken: paginatedZakenFactory(),
};

export const ReviewDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => {
          const storageKey = getDestructionListReviewKey(
            FIXTURE.uuid,
            FIXTURE.destructionList.status,
          );
          const zakenOnPage = FIXTURE.paginatedZaken.results.map(
            (z) => z.url as string,
          );

          const approvedZaakUrlsOnPagePromise = await Promise.all(
            zakenOnPage.map(async (url) => {
              const selection = await getZaakSelectionItems<{
                approved: boolean;
              }>(storageKey, [url]);
              const item = selection[url];
              return { url, approved: item?.detail?.approved };
            }),
          );

          const approvedZaakUrlsOnPage = approvedZaakUrlsOnPagePromise
            .filter((result) => result.approved)
            .map((result) => result.url);

          const excludedZaakSelection = await getFilteredZaakSelection<{
            approved: false;
          }>(storageKey, { approved: false });

          return {
            ...FIXTURE,
            approvedZaakUrlsOnPage,
            excludedZaakSelection,
          };
        },
        action: destructionListReviewAction,
      },
    },
  },
  play: async (context) => {
    const { canvasElement } = context;
    const canvas = within(canvasElement);

    const storageKey = getDestructionListReviewKey(
      FIXTURE.uuid,
      FIXTURE.destructionList.status,
    );
    await clearZaakSelection(storageKey);

    const excludeButtons = await canvas.findAllByText("Uitzonderen");
    await userEvent.click(excludeButtons[0], { delay: 10 });
  },
};
