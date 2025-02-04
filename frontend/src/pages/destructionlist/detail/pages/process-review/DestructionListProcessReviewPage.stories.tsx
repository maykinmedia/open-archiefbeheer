import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { ReactRouterDecorator } from "../../../../../../.storybook/decorators";
import {
  clickButton,
  fillForm,
} from "../../../../../../.storybook/playFunctions";
import { destructionListFactory } from "../../../../../fixtures/destructionList";
import { paginatedZakenFactory } from "../../../../../fixtures/paginatedZaken";
import { reviewFactory } from "../../../../../fixtures/review";
import { reviewItemsFactory } from "../../../../../fixtures/reviewItem";
import { FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP } from "../../../../../fixtures/selectieLijstKlasseChoices";
import { usersFactory } from "../../../../../fixtures/user";
import { getZaakSelection } from "../../../../../lib/zaakSelection";
import { destructionListProcessReviewAction } from "../../DestructionListDetail.action";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { DestructionListProcessReviewPage } from "./DestructionListProcessReviewPage";

const meta: Meta<typeof DestructionListProcessReviewPage> = {
  title: "Pages/DestructionList/DestructionListProcessReviewPage",
  component: DestructionListProcessReviewPage,
  decorators: [ReactRouterDecorator],
  parameters: {
    reactRouterDecorator: {
      route: {
        id: "destruction-list:detail",
        // loader:
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            FIXTURE_PROCESS_REVIEW.storageKey,
          );
          return { ...FIXTURE_PROCESS_REVIEW, zaakSelection };
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FIXTURE_PROCESS_REVIEW: DestructionListDetailContext = {
  storageKey: `storybook-storage-key!${meta.title}:ProcessReview`,

  destructionList: { ...destructionListFactory(), status: "changes_requested" },
  destructionListItems: {
    count: reviewItemsFactory().length,
    next: null,
    previous: null,
    results: [],
  },

  zaakSelection: {},
  selectableZaken: paginatedZakenFactory(),

  archivists: usersFactory(),
  user: usersFactory()[0],

  review: reviewFactory(),
  reviewItems: reviewItemsFactory(),

  selectieLijstKlasseChoicesMap: FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
};

export const ProcessReview: Story = {
  parameters: {
    reactRouterDecorator: {
      route: {
        action: destructionListProcessReviewAction,
        loader: async () => {
          const zaakSelection = await getZaakSelection(
            `${FIXTURE_PROCESS_REVIEW.storageKey}`,
          );

          return { ...FIXTURE_PROCESS_REVIEW, zaakSelection };
        },
      },
    },
  },
  play: async (context) => {
    await clickButton({
      ...context,
      parameters: { clickButton: { name: "Muteren", elementIndex: 0 } },
    });
    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          formValues: {
            Actie: "Aanpassen van selectielijstklasse",
            Selectielijstklasse: "1.2 - Ingesteld - blijvend_bewaren",
            Reden: "ProcessReview",
          },
        },
      },
    });

    await clickButton({
      ...context,
      parameters: { clickButton: { name: "Muteren", elementIndex: 1 } },
    });
    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          formValues: {
            Actie: "Afwijzen van het voorstel",
            Reden: "ProcessReview",
          },
        },
      },
    });

    await clickButton({
      ...context,
      parameters: { clickButton: { name: "Muteren", elementIndex: 2 } },
    });
    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          formValues: {
            Actie: "Afwijzen van het voorstel",
            Reden: "ProcessReview",
          },
        },
      },
    });

    // Hover over the tooltip badge (modify the selector based on your implementation)
    const tooltipBadge = await within(context.canvasElement).findAllByText(
      "Voorstel afgewezen",
    );
    await userEvent.hover(tooltipBadge[0]);

    // Expect class `mykn-tooltip` to have `visible` attribute to be `true`
    await clickButton({
      ...context,
      parameters: {
        clickButton: { name: "Opnieuw indienen" },
      },
    });
    await fillForm({
      ...context,
      parameters: {
        fillForm: {
          formValues: {
            Opmerking: "ProcessReview",
          },
        },
      },
    });
  },
};
