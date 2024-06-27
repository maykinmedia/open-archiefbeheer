import {
  AttributeTable,
  Badge,
  Body,
  CardBaseTemplate,
  Column,
  Grid,
  H2,
  LabeledAttributeData,
  Option,
  P,
} from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect, useLoaderData } from "react-router-dom";

import { User } from "../../../lib/api/auth";
import {
  DestructionList,
  DestructionListItemUpdate,
  DestructionListUpdateData,
  getDestructionList,
  updateDestructionList,
} from "../../../lib/api/destructionLists";
import { listSelectieLijstKlasseChoices } from "../../../lib/api/private";
import { getLatestReview, listReviewItems } from "../../../lib/api/review";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canUpdateDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import {
  ZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { formatUser } from "../utils";
import { AssigneesEditable } from "./Assignees";
import "./DestructionListDetail.css";
import { DestructionListItems } from "./DestructionListItems";
import { STATUS_LEVEL_MAPPING, STATUS_MAPPING } from "./constants";
import { DestructionListDetailContext } from "./types";

function getDisplayableList(
  destructionList: DestructionList,
): LabeledAttributeData {
  const createdOn = new Date(destructionList.created);
  const formattedCreatedOn = createdOn.toLocaleString("nl-nl", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return {
    auteur: { label: "Auteur", value: formatUser(destructionList.author) },
    bevatGevoeligeInformatie: {
      label: "Bevat gevoelige informatie",
      value: destructionList.containsSensitiveInfo,
    },
    status: {
      label: "Status",
      value: (
        <Badge level={STATUS_LEVEL_MAPPING[destructionList.status]}>
          {STATUS_MAPPING[destructionList.status]}
        </Badge>
      ),
    },
    aangemaakt: {
      label: "Aangemaakt",
      value: formattedCreatedOn,
    },
  };
}

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { destructionList, reviewers } =
    useLoaderData() as DestructionListDetailContext;

  // TODO - Make a 404 page
  if (!destructionList) return <div>Deze vernietigingslijst bestaat niet.</div>;

  return (
    <div className="destruction-list-detail">
      <CardBaseTemplate>
        <Body>
          <H2>{destructionList.name}</H2>
          <Grid>
            <Column span={3}>
              <AttributeTable
                labeledObject={getDisplayableList(destructionList)}
              />
            </Column>
            <Column span={9}>
              <AssigneesEditable
                assignees={destructionList.assignees}
                reviewers={reviewers}
              />
            </Column>
          </Grid>
        </Body>
        <DestructionListItems />
      </CardBaseTemplate>
    </div>
  );
}

/**
 * React Router loader.
 */
export async function destructionListUpdateAction({
  request,
  params,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const assigneesData =
    formData.has("assigneeIds") && formData.getAll("assigneeIds");
  const items = formData.has("zaakUrls") && formData.getAll("zaakUrls");
  const data: DestructionListUpdateData = {};

  if (assigneesData) {
    data.assignees = assigneesData
      .filter((id) => id !== "") // Case in which a reviewer is removed
      .map((id, index) => ({
        user: Number(id),
        order: index,
      }));
  }

  if (items) {
    data.items = items.map((zaakUrl) => ({
      zaak: zaakUrl,
    })) as DestructionListItemUpdate[];
  }

  try {
    await updateDestructionList(params.uuid as string, data);
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
  canUpdateDestructionListRequired(
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
          ? Object.fromEntries(
              await Promise.all(
                reviewItems.map(async (ri) => {
                  const choices = await listSelectieLijstKlasseChoices({
                    zaak: ri.zaak.url,
                  });
                  return [ri.zaak.url, choices];
                }),
              ),
            )
          : null,
      ];

      const [
        reviewers,
        zaken,
        allZaken,
        zaakSelection,
        selectieLijstKlasseChoicesMap,
      ] = (await Promise.all(promises)) as [
        User[],
        PaginatedZaken,
        PaginatedZaken,
        ZaakSelection,
        Record<string, Option[]>,
      ];

      return {
        storageKey,
        destructionList,
        reviewers,
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
