import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../.storybook/decorators";
import { destructionListFactory } from "../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../fixtures/review";
import { userFactory, usersFactory } from "../../../fixtures/user";
import {
  clearZaakSelection,
  getFilteredZaakSelection,
  getZaakSelection,
  getZaakSelectionItem,
} from "../../../lib/zaakSelection/zaakSelection";
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
  parameters: {
    mockData: [
      {
        url: "http://localhost:8000/api/v1/_zaaktypen-choices/?destructionList=00000000-0000-0000-0000-000000000000",
        method: "GET",
        status: 200,
        response: [
          {
            label: "Melding klein kansspel",
            value:
              "https://test.openzaak.nl/catalogi/api/v1/zaaktypen/e95d9bdf-588d-4965-a469-378d9e0ca91e",
            extra: "MKK",
          },
        ],
      },
      {
        url: "http://localhost:8000/api/v1/_zaaktypen-choices?",
        method: "GET",
        status: 200,
        response: [
          {
            label: "Melding klein kansspel",
            value:
              "https://test.openzaak.nl/catalogi/api/v1/zaaktypen/e95d9bdf-588d-4965-a469-378d9e0ca91e",
            extra: "MKK",
          },
        ],
      },
      {
        url: "http://localhost:8000/api/v1/whoami",
        method: "GET",
        status: 200,
        response: userFactory(),
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE: DestructionListReviewContext = {
  uuid: "00000000-0000-0000-0000-000000000000",
  destructionList: destructionListFactory(),
  logItems: [],
  review: reviewFactory(),
  reviewers: usersFactory(),
  zaken: paginatedZakenFactory(),
  approvedZaakUrlsOnPage: [],
  excludedZaakSelection: {},
};

export const ReviewDestructionList: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        loader: async () => {
          const storageKey = getDestructionListReviewKey(FIXTURE.uuid);
          const zaakSelection = await getZaakSelection(storageKey);
          const zakenOnPage = FIXTURE.zaken.results.map((z) => z.url as string);

          const approvedZaakUrlsOnPagePromise = await Promise.all(
            zakenOnPage.map(async (url) => {
              const item = await getZaakSelectionItem<typeof zaakSelection>(
                storageKey,
                url,
              );
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

    const storageKey = getDestructionListReviewKey(FIXTURE.uuid);
    await clearZaakSelection(storageKey);

    const acceptButtons = await canvas.findAllByText("Accorderen");
    const excludeButtons = await canvas.findAllByText("Uitzonderen");

    // userEvent.click() does not seem to work here?
    await acceptButtons[0].click();
    await acceptButtons[1].click();
    await excludeButtons[2].click();

    const prompt = await canvas.findByLabelText("Reden");
    await userEvent.click(prompt, { delay: 10 });
    await userEvent.type(prompt, "Test", { delay: 100 });
    const submit = await canvas.findByText("Zaak uitzonderen");
    await userEvent.click(submit, { delay: 10 });
    await waitFor(async () => expect(submit).not.toBeInTheDocument());

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const markAll = await canvas.findByLabelText(
      "Alles als (on)gezien markeren",
    );
    await userEvent.click(markAll, { delay: 100 });

    const markAllAgain = await canvas.findByLabelText(
      "Alles als (on)gezien markeren",
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.click(markAllAgain, { delay: 100 });
  },
};
