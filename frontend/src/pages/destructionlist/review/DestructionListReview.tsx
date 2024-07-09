import {
  AttributeData,
  AttributeTable,
  Body,
  Column,
  Form,
  FormField,
  Grid,
  H2,
  H3,
  Hr,
  Modal,
  Outline,
  P,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useState } from "react";
import {
  ActionFunctionArgs,
  redirect,
  useLoaderData,
  useSubmit,
} from "react-router-dom";
import { useAsync } from "react-use";

import { DestructionList as DestructionListComponent } from "../../../components";
import { DestructionListToolbar } from "../../../components/DestructionListToolbar/DestructionListToolbar";
import { User } from "../../../lib/api/auth";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  Review,
  ReviewItem,
  createDestructionListReview,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import {
  ReviewResponse,
  getLatestReviewResponse,
} from "../../../lib/api/reviewResponse";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canReviewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { formatDate } from "../../../lib/format/date";
import {
  ZaakSelection,
  addToZaakSelection,
  getZaakSelection,
  isZaakSelected,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import "./DestructionListReview.css";

const getDestructionListReviewKey = (id: string) =>
  `destruction-list-review-${id}`;

/**
 * The interface for the zaken modal state
 */
interface ZaakModalDataState {
  open: boolean;
  title?: string;
  uuid?: string;
}

/**
 * The interface for the list modal state
 */
interface ListModalDataState {
  listFeedback?: string;
  open: boolean;
}

/**
 * The interface for the form data of the zaken
 */
interface FormDataState {
  motivation: string;
  uuid: string;
  url: string;
}

/**
 * Review-destruction-list page
 */
export function DestructionListReviewPage() {
  const {
    reviewItems,
    reviewResponse,
    zaken,
    selectedZaken,
    uuid,
    destructionList,
  } = useLoaderData() as DestructionListReviewLoaderContext;
  const submit = useSubmit();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);

  /* Tooltip Motivation */
  const [tooltipMotivation, setTooltipMotivation] = useState<string>("");

  /* State to manage the count of selected zaken */
  const [zaakSelection, setZaakSelection] = useState<FormDataState[]>([]);

  /* State to manage the state of the zaak modal (when clicking a checkbox) */
  const [zaakModalDataState, setZaakModalDataState] =
    useState<ZaakModalDataState>({
      open: false,
    });

  /* State to handle the modal for the entire list (when clicking on the page action) */
  const [listModalDataState, setListModalDataState] =
    useState<ListModalDataState>({
      open: false,
    });

  /* On render of the page we will update the selection count */
  useAsync(async () => {
    await updateZaakSelectionCountState();
  }, []);

  /* Triggered once you select (click a checkbox) a specific row in the list */
  const onSelect = async (row: AttributeData[], selected: boolean) => {
    const firstZaak = row[0] as unknown as Zaak;
    /* If we deselect, we remove it from the selection list and update the count */
    if (!selected) {
      await removeFromZaakSelection(destructionListReviewKey, [firstZaak]);
      void updateZaakSelectionCountState();
      return;
    }
    /* Otherwise, we open up a modal */
    setZaakModalDataState({
      // TODO: Control the check/uncheck of the checkbox? Is this even necessary if we move away from checkboxes later on? It's quite some work.
      open: true,
      uuid: firstZaak.uuid,
      title: `${firstZaak.identificatie} uitzonderen`,
    });
  };

  /* The fields for the zaken modal (when you click a checkbox) */
  const zaakModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Reden van uitzondering",
      placeholder: "Vul hier een reden voor uitzondering in",
      name: "motivation",
      type: "text",
      required: true,
    },
  ];

  /* The fields for the entire list (when you click the page action) */
  const listModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Opmerking",
      name: "list_feedback",
      placeholder: "Vul hier een opmerking(en) in",
      type: "text",
      required: true,
    },
  ];

  /**
   * Gets called whenever you submit the zaken form that's triggered by clicking a checkbox
   * @param _
   * @param data
   */
  const onSubmitZaakForm = async (_: FormEvent, data: AttributeData) => {
    const zaak = zaken.results.find((z) => z.uuid === zaakModalDataState.uuid)!;
    await addToZaakSelection<FormDataState>(destructionListReviewKey, [zaak], {
      ...(data as {
        motivation: string;
      }),
      uuid: zaakModalDataState.uuid!,
      url: zaak.url as string,
    });
    setZaakModalDataState({ open: false });
    await updateZaakSelectionCountState();
  };

  /**
   * Gets called whenever you submit the list form that's triggered by clicking the page action
   * @param _
   * @param data
   */
  const onSubmitDestructionListForm = async (
    _: FormEvent,
    data: AttributeData,
  ) => {
    submit(
      {
        listFeedback: data.list_feedback as string,
      },
      { method: "POST", encType: "application/json" },
    );
  };

  /**
   * Updates the count of the selected zaken to the state
   */
  const updateZaakSelectionCountState = async () => {
    const zaakSelection = await getZaakSelection<FormDataState>(
      destructionListReviewKey,
    );
    const zaakSelectionSelected = Object.values(zaakSelection).filter(
      (f) => f.selected,
    );
    setZaakSelection(zaakSelectionSelected.map((f) => f.detail!));
  };

  const activeReviewItem = reviewItems?.find(
    (ri) => ri.zaak.uuid === zaakModalDataState.uuid,
  );
  const activeItemResponse =
    activeReviewItem &&
    reviewResponse?.itemsResponses.find(
      (ir) => ir.reviewItem === activeReviewItem.pk,
    );

  return (
    <>
      <Modal
        allowClose={false}
        open={zaakModalDataState.open}
        size="m"
        title={zaakModalDataState.title}
      >
        <Body>
          {activeItemResponse && (
            <>
              <Grid>
                <Column span={3}>
                  <H3>
                    Antwoord (
                    {formatDate(new Date(String(activeItemResponse?.created)))})
                  </H3>
                </Column>

                <Column span={9}>
                  <P bold>Opmerkingen</P>
                  <P muted>{activeItemResponse.comment}</P>
                </Column>
              </Grid>

              <Hr />
            </>
          )}

          <Grid>
            <Column span={3}>
              <H3>Wijzigingen</H3>
            </Column>

            <Column span={9}>
              <Form
                fields={zaakModalFormFields}
                onSubmit={onSubmitZaakForm}
                validateOnChange={true}
                labelSubmit={"Uitzonderen"}
              />
            </Column>
          </Grid>
        </Body>
      </Modal>
      <Modal
        title={zaakSelection.length > 0 ? "Beoordelen" : "Accoderen"}
        open={listModalDataState.open}
        size="m"
        onClose={() => setListModalDataState({ open: false })}
      >
        <Body>
          <Form
            fields={listModalFormFields}
            onSubmit={onSubmitDestructionListForm}
            validateOnChange
            labelSubmit={zaakSelection.length > 0 ? "Beoordelen" : "Accoderen"}
          />
        </Body>
      </Modal>

      <DestructionListComponent
        storageKey={destructionListReviewKey}
        zaken={zaken}
        selectedZaken={selectedZaken}
        labelAction={zaakSelection.length > 0 ? "Beoordelen" : "Accoderen"}
        title="Zaakdossiers"
        onSubmitSelection={() => setListModalDataState({ open: true })}
        onSelect={onSelect}
        allowSelectAll={false}
        actions={[
          {
            children: <Outline.ChatBubbleBottomCenterIcon />,
            title: "Uitzonderen",
            tooltip: tooltipMotivation && (
              <AttributeTable
                object={{
                  // "Opmerking van auteur":
                  "Reden van uitzondering": tooltipMotivation,
                }}
                valign="start"
              />
            ),
            onInteract: (_, detail) => {
              const _detail = detail as FormDataState | undefined;
              if (_detail) {
                setTooltipMotivation(_detail.motivation);
              } else {
                setTooltipMotivation("");
              }
            },
            onClick: (zaak: Zaak) => {
              setZaakModalDataState({
                open: true,
                uuid: zaak.uuid,
                title: `${zaak.identificatie} uitzonderen`,
              });
            },
          },
        ]}
      >
        <DestructionListToolbar
          destructionList={destructionList}
          reviewResponse={reviewResponse}
        />
      </DestructionListComponent>
    </>
  );
}

/**
 * The context of the loader
 */
export type DestructionListReviewLoaderContext = {
  reviewers: User[];
  reviewItems?: ReviewItem[];
  reviewResponse?: ReviewResponse;
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  uuid: string;
  destructionList: DestructionList;
};

/**
 * React Router loader.
 * @param request
 * @param params
 */
export const destructionListReviewLoader = loginRequired(
  canReviewDestructionListRequired<DestructionListReviewLoaderContext>(
    async ({
      request,
      params,
    }: ActionFunctionArgs): Promise<DestructionListReviewLoaderContext> => {
      const searchParams = new URL(request.url).searchParams;
      const uuid = params.uuid as string;
      searchParams.set("destruction_list", uuid);
      const objParams = Object.fromEntries(searchParams);

      const zakenPromise = listZaken({
        ...objParams,
        in_destruction_list: uuid,
      });
      const listsPromise = getDestructionList(uuid);
      const reviewersPromise = listReviewers();
      const latestReview = await getLatestReview({
        destructionList__uuid: uuid,
      });
      const reviewItemsPromise = latestReview
        ? listReviewItems({ review: latestReview.pk })
        : undefined;

      const reviewResponsePromise = latestReview
        ? getLatestReviewResponse({
            review: latestReview.pk,
          })
        : undefined;

      const [zaken, list, reviewers, reviewItems, reviewResponse] =
        await Promise.all([
          zakenPromise,
          listsPromise,
          reviewersPromise,
          reviewItemsPromise,
          reviewResponsePromise,
        ]);

      const isZaakSelectedPromises = zaken.results.map((zaak) =>
        isZaakSelected(getDestructionListReviewKey(uuid), zaak),
      );
      const isZaakSelectedResults = await Promise.all(isZaakSelectedPromises);
      const selectedZaken = zaken.results.filter(
        (_, index) => isZaakSelectedResults[index],
      );

      return {
        reviewers,
        reviewItems,
        reviewResponse,
        zaken,
        selectedZaken,
        uuid,
        destructionList: list,
      } satisfies DestructionListReviewLoaderContext;
    },
  ),
);

type DestructionListReviewActionContext = {
  details: {
    listFeedback: string;
  };
};

/**
 * React Router action.
 * @param request
 * @param params
 */
export const destructionListReviewAction = async ({
  request,
  params,
}: ActionFunctionArgs<DestructionListReviewActionContext>) => {
  const details =
    (await request.json()) as DestructionListReviewActionContext["details"];
  const destructionListUuid = params.uuid;

  if (!destructionListUuid) {
    throw new Error("No uuid provided");
  }

  const storageKey = getDestructionListReviewKey(destructionListUuid as string);
  const searchParams = new URLSearchParams();
  searchParams.set("destruction_list", destructionListUuid);

  // Get data
  const promises = [getZaakSelection(storageKey)];

  const [zaakSelection] = (await Promise.all(promises)) as [ZaakSelection];

  const zaakSelectionValid = Object.values(zaakSelection).filter(
    (f) => f.selected,
  );

  const data: Review = {
    destructionList: destructionListUuid,
    decision: zaakSelectionValid.length > 0 ? "rejected" : "accepted",
    listFeedback: details.listFeedback,
    zakenReviews: zaakSelectionValid.map((zaak) => {
      if (!zaak.detail) {
        throw new Error("Details are missing for one or more zaken");
      }
      const detail = zaak.detail as FormDataState;

      return {
        zaakUrl: detail.url,
        feedback: detail.motivation,
      };
    }),
  };
  await createDestructionListReview(data);
  return redirect("/");
};
