import {
  Body,
  CardBaseTemplate,
  Form,
  FormField,
  Modal,
  Option,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import { FormEvent, useState } from "react";
import { redirect, useLoaderData, useNavigate } from "react-router-dom";

import { DestructionListToolbar } from "../../../components/DestructionListToolbar/DestructionListToolbar";
import { TypedAction } from "../../../hooks";
import { listArchivists } from "../../../lib/api/archivist";
import { User, whoAmI } from "../../../lib/api/auth";
import {
  DestructionListItemUpdate,
  getDestructionList,
  markDestructionListAsFinal,
  updateDestructionList,
} from "../../../lib/api/destructionLists";
import { listSelectieLijstKlasseChoices } from "../../../lib/api/private";
import { getLatestReview, listReviewItems } from "../../../lib/api/review";
import {
  ReviewResponse,
  createReviewResponse,
} from "../../../lib/api/reviewResponse";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canViewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { canMarkListAsFinal } from "../../../lib/auth/permissions";
import { cacheMemo } from "../../../lib/cache/cache";
import {
  ZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import "./DestructionListDetail.css";
import { DestructionListEdit } from "./DestructionListEdit";
import { DestructionListProcessReview } from "./DestructionListProcessReview";
import { DestructionListDetailContext } from "./types";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { archivists, destructionList, review, reviewers, user } =
    useLoaderData() as DestructionListDetailContext;

  const [modalOpenState, setModalOpenState] = useState(false);
  const navigate = useNavigate();

  const modalFormFields: FormField[] = [
    {
      label: "Archivaris",
      name: "assigneeIds",
      options: archivists.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
  ];

  // TODO - Make a 404 page
  if (!destructionList) return <div>Deze vernietigingslijst bestaat niet.</div>;

  const onSubmit = async (_: FormEvent, data: SerializedFormData) => {
    await markDestructionListAsFinal(destructionList.uuid, {
      user: Number(data.assigneeIds),
    });
    setModalOpenState(false);
    return navigate("/");
  };

  return (
    <CardBaseTemplate
      secondaryNavigationItems={
        canMarkListAsFinal(user, destructionList)
          ? [
              {
                children: "Markeren als definitief",
                onClick: () => setModalOpenState(true),
                pad: "h",
              },
            ]
          : undefined
      }
    >
      <DestructionListToolbar
        destructionList={destructionList}
        review={review}
        reviewers={reviewers}
      />
      {review ? <DestructionListProcessReview /> : <DestructionListEdit />}
      <Modal
        title="Markeer als definitief"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            fields={modalFormFields}
            onSubmit={onSubmit}
            validateOnChange={true}
            role="form"
          />
        </Body>
      </Modal>
    </CardBaseTemplate>
  );
}

export type UpdateDestructionListAction<T> = TypedAction<
  "PROCESS_REVIEW" | "UPDATE_ASSIGNEES" | "UPDATE_ZAKEN",
  T
>;

/**
 * React Router action.
 */
export async function destructionListUpdateAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data = await request.clone().json();
  const action = data as UpdateDestructionListAction<unknown>;

  switch (action.type) {
    case "PROCESS_REVIEW":
      return await destructionListProcessReviewAction({ request, params });
    case "UPDATE_ASSIGNEES":
      return await destructionListUpdateAssigneesAction({ request, params });
    case "UPDATE_ZAKEN":
      return await destructionListUpdateZakenAction({ request, params });
    default:
      throw new Error("INVALID ACTION TYPE SPECIFIED!");
  }
}

/**
 * React Router action (user intents to adds/remove zaken to/from the destruction list).
 */
export async function destructionListProcessReviewAction({
  request,
}: ActionFunctionArgs) {
  const data = await request.json();
  const reviewResponse: ReviewResponse = data.payload;

  try {
    await createReviewResponse(reviewResponse);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect("/");
}

/**
 * React Router action (user intents to reassign the destruction list).
 */
export async function destructionListUpdateAssigneesAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data: UpdateDestructionListAction<
    Record<string, string | Array<number | string>>
  > = await request.json();
  const { assigneeIds, comment } = data.payload;

  const assignees = (assigneeIds as Array<number | string>)
    .filter((id) => id !== "") // Case in which a reviewer is removed
    .map((id, index) => ({
      user: Number(id),
      order: index,
    }));

  try {
    await updateDestructionList(params.uuid as string, {
      assignees,
      comment: String(comment),
    });
  } catch (e: unknown) {
    if (e instanceof Response) {
      return await (e as Response).json();
    }
    throw e;
  }
  return redirect(`/destruction-lists/${params.uuid}/`);
}

/**
 * React Router action (user intents to adds/remove zaken to/from the destruction list).
 */
export async function destructionListUpdateZakenAction({
  request,
  params,
}: ActionFunctionArgs) {
  const data: UpdateDestructionListAction<Record<string, string[]>> =
    await request.json();
  const { zaakUrls } = data.payload;

  const items = zaakUrls.map((zaakUrl) => ({
    zaak: zaakUrl,
  })) as DestructionListItemUpdate[];

  try {
    await updateDestructionList(params.uuid as string, { items });
  } catch (e: unknown) {
    if (e instanceof Response) return await (e as Response).json();

    throw e;
  }

  return redirect(`/destruction-lists/${params.uuid}/`);
}

/**
 * React Router loader.
 */
export const destructionListDetailLoader = loginRequired(
  canViewDestructionListRequired(
    async ({
      request,
      params,
    }: ActionFunctionArgs): Promise<DestructionListDetailContext> => {
      const uuid = params.uuid as string;
      const searchParams = Object.fromEntries(
        new URL(request.url).searchParams,
      );

      // We need to fetch the destruction list first to get the status.
      const destructionList = await getDestructionList(uuid as string);
      const storageKey = `destruction-list-detail-${uuid}-${destructionList.status}`;

      // If status indicates review: collect it.
      const review =
        destructionList.status === "changes_requested"
          ? await getLatestReview({
              destructionList__uuid: uuid,
            })
          : null;

      // If review collected: collect items.
      const reviewItems = review
        ? await listReviewItems({ review: review.pk })
        : null;

      // Run multiple requests in parallel, some requests are based on context.
      const promises = [
        // Fetch all possible reviewers to allow reassignment.
        listReviewers(),
        listArchivists(),
        whoAmI(),

        // Fetch selectable zaken: empty array if review collected OR all zaken not in another destruction list.
        // FIXME: Accept no/implement real pagination?
        reviewItems
          ? ({
              count: reviewItems.length,
              next: null,
              previous: null,
              results: [],
            } as PaginatedZaken)
          : listZaken({ ...searchParams, in_destruction_list: uuid }).catch(
              // Intercept (and ignore) 404 due to the following scenario cause by shared `page` parameter:
              //
              // User navigates to destruction list with 1 page of items.
              // Users click edit button
              // User navigates to page 2
              // zaken API with param `in_destruction_list` may return 404.
              (e) => {
                if (e.status === 404) {
                  return {
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                  };
                }
              },
            ),

        // Fetch selectable zaken: empty array if review collected OR all zaken not in another destruction list.
        // FIXME: Accept no/implement real pagination?
        reviewItems
          ? ({
              count: 0,
              next: null,
              previous: null,
              results: [],
            } as PaginatedZaken)
          : listZaken({
              ...searchParams,
              not_in_destruction_list_except: uuid,
            }),

        // Fetch the selected zaken.
        getZaakSelection(storageKey),

        // Fetch selectielijst choices if review collected.
        // reviewItems ? await listSelectieLijstKlasseChoices({}) : null,
        reviewItems
          ? cacheMemo(
              "selectieLijstKlasseChoicesMap",
              async () =>
                Object.fromEntries(
                  await Promise.all(
                    reviewItems.map(async (ri) => {
                      const choices = await listSelectieLijstKlasseChoices({
                        zaak: ri.zaak.url,
                      });
                      return [ri.zaak.url, choices];
                    }),
                  ),
                ),
              reviewItems.map((ri) => ri.pk),
            )
          : null,
      ];

      const [
        reviewers,
        archivists,
        user,
        zaken,
        allZaken,
        zaakSelection,
        selectieLijstKlasseChoicesMap,
      ] = (await Promise.all(promises)) as [
        User[],
        User[],
        User,
        PaginatedZaken,
        PaginatedZaken,
        ZaakSelection,
        Record<string, Option[]>,
      ];

      // remove all the archivists that are currently as assignees
      const filteredArchivists = archivists.filter(
        (archivist) =>
          !destructionList.assignees.some(
            (assignee) => assignee.user.pk === archivist.pk,
          ),
      );
      return {
        storageKey,
        destructionList,
        reviewers,
        archivists: filteredArchivists,
        user,
        zaken,
        selectableZaken: allZaken,
        zaakSelection,
        review: review,
        reviewItems: reviewItems,
        selectieLijstKlasseChoicesMap,
      };
    },
  ),
);
