import { Option } from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";

import { listArchivists } from "../../../lib/api/archivist";
import { User, whoAmI } from "../../../lib/api/auth";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import { listSelectieLijstKlasseChoices } from "../../../lib/api/private";
import {
  Review,
  ReviewItem,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import { listReviewers } from "../../../lib/api/reviewers";
import { ZaakSelection } from "../../../lib/api/zaakSelection";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canViewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { cacheMemo } from "../../../lib/cache/cache";
import { getZaakSelection } from "../../../lib/zaakSelection/zaakSelection";

export interface DestructionListDetailContext {
  storageKey: string;
  destructionList: DestructionList;
  reviewers: User[];
  archivists: User[];
  user: User;
  zaken: PaginatedZaken;
  selectableZaken: PaginatedZaken;
  zaakSelection: ZaakSelection;
  review: Review | null;
  reviewItems: ReviewItem[] | null;
  selectieLijstKlasseChoicesMap: Record<string, Option[]> | null;
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
        reviewItems || destructionList.status === "ready_to_delete"
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
        getZaakSelection(storageKey, true),

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
