import { Option } from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";

import { listArchivists } from "../../../lib/api/archivist";
import { AuditLogItem, listAuditLog } from "../../../lib/api/auditLog";
import { User, whoAmI } from "../../../lib/api/auth";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  PaginatedDestructionListItems,
  listDestructionListItems,
} from "../../../lib/api/destructionListsItem";
import { listSelectieLijstKlasseChoices } from "../../../lib/api/private";
import {
  Review,
  ReviewItem,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canViewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { cacheMemo } from "../../../lib/cache/cache";
import {
  ZaakSelection,
  getZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";

export interface DestructionListDetailContext {
  storageKey: string;

  destructionList: DestructionList;
  destructionListItems: PaginatedDestructionListItems;
  logItems: AuditLogItem[];

  zaakSelection: ZaakSelection;
  selectableZaken: PaginatedZaken;

  archivists: User[];
  reviewers: User[];
  user: User;

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

      /**
       * Fetch selectable zaken: empty array if review collected OR all zaken not in another destruction list.
       * FIXME: Accept no/implement real pagination?
       */
      const getDestructionListItems =
        async (): Promise<PaginatedDestructionListItems> =>
          reviewItems
            ? {
                count: reviewItems.length,
                next: null,
                previous: null,
                results: [],
              }
            : await listDestructionListItems(
                uuid,
                searchParams as unknown as URLSearchParams,
              ).catch((e) => {
                // This happens when the user is browsing selectable zaken and exceeds
                // the last page of the destruction list items.
                if (
                  searchParams.is_editing &&
                  e instanceof Response &&
                  e.status === 404
                ) {
                  return {
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                  };
                }
                throw e;
              });

      /**
       * Fetch selectielijst choices if review collected.
       * reviewItems ? await listSelectieLijstKlasseChoices({}) : null,
       */
      const getReviewItems = () =>
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
          : null;

      const getSelectableZaken = () =>
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
            });

      const [
        destructionListItems,
        logItems,
        zaakSelection,
        allZaken,
        archivists,
        reviewers,
        user,
        selectieLijstKlasseChoicesMap,
      ] = await Promise.all([
        getDestructionListItems(),
        listAuditLog(destructionList.uuid),
        getZaakSelection(storageKey),
        getSelectableZaken(),
        listArchivists(),
        listReviewers(),
        whoAmI(),
        getReviewItems(),
      ]);

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
        destructionListItems: destructionListItems,
        logItems,

        zaakSelection,
        selectableZaken: allZaken,

        archivists: filteredArchivists,
        reviewers,
        user,

        review: review,
        reviewItems: reviewItems,

        selectieLijstKlasseChoicesMap,
      };
    },
  ),
);
