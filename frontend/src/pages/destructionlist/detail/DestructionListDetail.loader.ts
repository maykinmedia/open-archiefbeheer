import { Option } from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";

import { listArchivists } from "../../../lib/api/archivist";
import { User, whoAmI } from "../../../lib/api/auth";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import {
  PaginatedDestructionListItems,
  listDestructionListItems,
} from "../../../lib/api/destructionListsItem";
import { listSelectielijstKlasseChoices } from "../../../lib/api/private";
import {
  Review,
  ReviewItemWithZaak,
  getLatestReview,
  listReviewItems,
} from "../../../lib/api/review";
import {
  ReviewResponse,
  getLatestReviewResponse,
} from "../../../lib/api/reviewResponse";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canViewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { cacheMemo } from "../../../lib/cache/cache";
import { ZaakSelection, getZaakSelection } from "../../../lib/zaakSelection";

export interface DestructionListDetailContext {
  storageKey: string;

  destructionList: DestructionList;
  destructionListItems: PaginatedDestructionListItems;

  zaakSelection: ZaakSelection;
  selectableZaken: PaginatedZaken;

  archivists: User[];
  user: User;

  review: Review | null;
  reviewItems: ReviewItemWithZaak[] | null;
  reviewResponse?: ReviewResponse;

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
      const isEditing = searchParams.is_editing;
      const isInReview = destructionList.status === "changes_requested";
      // If status indicates review: collect it.
      const review = await getLatestReview({
        destructionList__uuid: uuid,
      });

      // If review collected: collect items.
      const reviewItems = isInReview
        ? await listReviewItems({
            ...searchParams,
            "item-review-review": review?.pk,
          })
        : null;

      // #378 - If for some unfortunate reason a zaak has been deleted outside of the process,
      // item.zaak can be null
      const reviewItemsWithZaak = reviewItems
        ? (reviewItems.filter((item) => !!item.zaak) as ReviewItemWithZaak[])
        : reviewItems;

      /**
       * Fetch selectable zaken: empty array if review collected OR all zaken not in another destruction list.
       * FIXME: Accept no/implement real pagination?
       */
      const getDestructionListItems =
        async (): Promise<PaginatedDestructionListItems> => {
          const params = searchParams;
          if (isEditing) {
            params["item-order_match_zaken"] = "true"; // Must be in sync with `listZaken()` ordering.
          }
          return reviewItemsWithZaak
            ? {
                count: reviewItemsWithZaak.length,
                next: null,
                previous: null,
                results: [],
              }
            : await listDestructionListItems(
                uuid,
                params as unknown as URLSearchParams,
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
        };

      /**
       * Fetch selectielijst choices if review collected.
       * reviewItems ? await listSelectieLijstKlasseChoices({}) : null,
       */
      const getReviewItems = () =>
        reviewItemsWithZaak
          ? cacheMemo(
              "selectieLijstKlasseChoicesMap",
              async () =>
                Object.fromEntries(
                  await Promise.all(
                    reviewItemsWithZaak.map(async (ri) => {
                      const choices = await listSelectielijstKlasseChoices({
                        zaak: ri.zaak.url,
                      });
                      return [ri.zaak.url, choices];
                    }),
                  ),
                ),
              // @ts-expect-error - Params not used in function but in case key only.
              reviewItemsWithZaak.map((ri) => ri.pk),
            )
          : null;

      const getSelectableZaken = () =>
        reviewItemsWithZaak || destructionList.status === "ready_to_delete"
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
        reviewResponse,
        zaakSelection,
        allZaken,
        archivists,
        user,
        selectieLijstKlasseChoicesMap,
      ] = await Promise.all([
        getDestructionListItems(),
        review &&
          getLatestReviewResponse({
            review: review.pk,
          }),
        getZaakSelection(storageKey),
        getSelectableZaken(),
        listArchivists(),
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

        zaakSelection,
        selectableZaken: allZaken,

        archivists: filteredArchivists,
        user,

        review: review,
        reviewItems: reviewItemsWithZaak,
        reviewResponse,

        selectieLijstKlasseChoicesMap,
      };
    },
  ),
);
