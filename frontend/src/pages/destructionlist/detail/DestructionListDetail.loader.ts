import { Option } from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";

import { listArchivists } from "../../../lib/api/archivist";
import { User, whoAmI } from "../../../lib/api/auth";
import { DestructionList } from "../../../lib/api/destructionLists";
import {
  PaginatedDestructionListItems,
  listDestructionListItems,
} from "../../../lib/api/destructionListsItem";
import { listSelectielijstKlasseChoices } from "../../../lib/api/private";
import { Review, ReviewItemWithZaak } from "../../../lib/api/review";
import { ReviewResponse } from "../../../lib/api/reviewResponse";
import { PaginatedZaken, searchZaken } from "../../../lib/api/zaken";
import {
  canViewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import { cacheMemo } from "../../../lib/cache/cache";
import { ZaakSelection, getZaakSelection } from "../../../lib/zaakSelection";
import { getBaseDestructionListLoaderData } from "../abstract/loaderutils";

export interface DestructionListDetailContext {
  destructionList: DestructionList;
  review?: Review | null;
  reviewItems: ReviewItemWithZaak[] | null;
  reviewResponse: ReviewResponse | null;
  storageKey: string;
  user: User;
  uuid: string;

  destructionListItems: PaginatedDestructionListItems;

  zaakSelection?: ZaakSelection;
  selectableZaken: PaginatedZaken;

  archivists: User[];

  selectieLijstKlasseChoicesMap: Record<string, Option[]> | null;
}

/**
 * React Router loader.
 */
export const destructionListDetailLoader = loginRequired(
  canViewDestructionListRequired(
    async (
      actionFunctionArgs: ActionFunctionArgs,
    ): Promise<DestructionListDetailContext> => {
      const { request } = actionFunctionArgs;

      const base = await getBaseDestructionListLoaderData(actionFunctionArgs);
      const uuid = base.uuid;
      const storageKey = base.storageKey;
      const destructionList = base.destructionList;
      const review = base.review;
      const reviewItems = base.reviewItems;

      const searchParams = new URL(request.url).searchParams;
      const objParams = Object.fromEntries(searchParams);

      const isEditing = objParams.is_editing;

      /**
       * Fetches items on the destruction list.
       */
      const getDestructionListItems =
        async (): Promise<PaginatedDestructionListItems> => {
          const params = objParams;
          if (isEditing) {
            params["item-order_match_zaken"] = "true"; // Must be in sync with `searchZaken()` ordering.
          }
          return reviewItems
            ? {
                count: reviewItems.length,
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
                if (isEditing && e instanceof Response && e.status === 404) {
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
       * // TODO: Investigate
       */
      const getSelectieLijstKlasseChoicesMap = () =>
        reviewItems
          ? cacheMemo(
              "selectieLijstKlasseChoicesMap",
              async () =>
                Object.fromEntries(
                  await Promise.all(
                    reviewItems.map(async (ri) => {
                      const choices = await listSelectielijstKlasseChoices(
                        {
                          zaak: ri.zaak.url,
                        },
                        true,
                      );
                      return [ri.zaak.url, choices];
                    }),
                  ),
                ),
              // @ts-expect-error - Params not used in function but in case key only.
              reviewItems.map((ri) => ri.pk),
            )
          : null;

      /**
       * Fetch zaken that are selectable (to add to a destruction list).
       */
      const getSelectableZaken = () =>
        reviewItems || destructionList.status === "ready_to_delete"
          ? ({
              count: 0,
              next: null,
              previous: null,
              results: [],
            } as PaginatedZaken)
          : searchZaken({
              ...objParams,
              not_in_destruction_list_except: uuid,
            });

      const [
        destructionListItems,
        zaakSelection,
        allZaken,
        archivists,
        user,
        selectieLijstKlasseChoicesMap,
      ] = await Promise.all([
        getDestructionListItems(),
        review ? getZaakSelection(storageKey) : undefined,
        getSelectableZaken(),
        listArchivists(),
        whoAmI(),
        getSelectieLijstKlasseChoicesMap(),
      ]);

      // remove all the archivists that are currently as assignees
      const filteredArchivists = archivists.filter(
        (archivist) =>
          !destructionList.assignees.some(
            (assignee) => assignee.user.pk === archivist.pk,
          ),
      );

      return {
        ...base,
        destructionListItems,
        zaakSelection,
        selectableZaken: allZaken,
        archivists: filteredArchivists,
        user,
        selectieLijstKlasseChoicesMap,
      };
    },
  ),
);
