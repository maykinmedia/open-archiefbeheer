import { Option } from "@maykin-ui/admin-ui";
import { invariant } from "@maykin-ui/client-common";
import { ActionFunctionArgs } from "@remix-run/router/utils";

import { listArchivists } from "../../../lib/api/archivist";
import { User } from "../../../lib/api/auth";
import { DestructionList } from "../../../lib/api/destructionLists";
import {
  PaginatedDestructionListItems,
  listDestructionListItems,
} from "../../../lib/api/destructionListsItem";
import { listSelectielijstKlasseChoices } from "../../../lib/api/private";
import { Review, ReviewItem } from "../../../lib/api/review";
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
  reviewItems: ReviewItem[] | null;
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

      const searchParams = new URL(request.url).searchParams;
      const objParams = Object.fromEntries(searchParams);
      const isEditing = objParams.is_editing;

      const {
        uuid,
        storageKeyPromise,
        destructionListPromise,
        reviewPromise,
        reviewItemsPromise,
        reviewResponsePromise,
        userPromise,
      } = await getBaseDestructionListLoaderData(actionFunctionArgs);

      /**
       * Fetches items on the destruction list.
       */
      const getDestructionListItems =
        async (): Promise<PaginatedDestructionListItems> => {
          return reviewItemsPromise.then(async (reviewItems) => {
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
          });
        };

      /**
       * Fetch selectielijst choices if review collected.
       * // TODO: Investigate
       */
      const getSelectieLijstKlasseChoicesMap = () => {
        return reviewItemsPromise.then((reviewItems) => {
          return reviewItems
            ? cacheMemo(
                "selectieLijstKlasseChoicesMap",
                async () =>
                  Object.fromEntries(
                    await Promise.all(
                      reviewItems
                        .filter((ri) => ri.destructionListItem.zaak)
                        .map(async (ri) => {
                          invariant(ri.destructionListItem.zaak);
                          const choices = await listSelectielijstKlasseChoices(
                            {
                              zaak: ri.destructionListItem.zaak.url,
                            },
                            true,
                          );
                          return [ri.destructionListItem.zaak.url, choices];
                        }),
                    ),
                  ),
                reviewItems.map((ri) => String(ri.pk)),
              )
            : null;
        });
      };

      const maybeGetZaakSelection = async () => {
        const promise = Promise.all([reviewPromise, storageKeyPromise]);
        return promise.then(([review, storageKey]) =>
          review ? getZaakSelection(storageKey) : undefined,
        );
      };

      /**
       * Fetch zaken that are selectable (to add to a destruction list).
       */
      const getSelectableZaken = () => {
        const promise = Promise.all([
          destructionListPromise,
          reviewItemsPromise,
        ]);
        return promise.then(([destructionList, reviewItems]) => {
          return reviewItems || destructionList.status === "ready_to_delete"
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
        });
      };

      const [
        destructionList,
        review,
        reviewItems,
        reviewResponse,
        storageKey,
        user,
        destructionListItems,
        zaakSelection,
        allZaken,
        archivists,
        selectieLijstKlasseChoicesMap,
      ] = await Promise.all([
        destructionListPromise,
        reviewPromise,
        reviewItemsPromise,
        reviewResponsePromise,
        storageKeyPromise,
        userPromise,
        getDestructionListItems(),
        maybeGetZaakSelection(),
        getSelectableZaken(),
        listArchivists(),
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
        destructionList,
        review,
        reviewItems,
        reviewResponse,
        storageKey,
        user,
        uuid,

        destructionListItems,
        zaakSelection,
        selectableZaken: allZaken,
        archivists: filteredArchivists,
        selectieLijstKlasseChoicesMap,
      };
    },
  ),
);
