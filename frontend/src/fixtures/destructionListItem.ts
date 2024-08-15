import {
  DestructionListItem,
  PaginatedDestructionListItems,
} from "../lib/api/destructionListsItem";
import { createArrayFactory, createObjectFactory } from "./factory";
import { zaakFactory } from "./zaak";

export const FIXTURE_DESTRUCTION_LIST_ITEM: DestructionListItem = {
  pk: 1,
  status: "suggested",
  extraZaakData: null,
  zaak: zaakFactory(),
  processingStatus: "new",
};

export const destructionListItemFactory = createObjectFactory(
  FIXTURE_DESTRUCTION_LIST_ITEM,
);
export const destructionListItemsFactory = createArrayFactory([
  FIXTURE_DESTRUCTION_LIST_ITEM,
]);

const FIXTURE_PAGINATED_DESTRUCTION_LIST_ITEMS = {
  count: 10,
  next: null,
  previous: null,
  results: destructionListItemsFactory(),
};

export const paginatedDestructionListItemsFactory =
  createObjectFactory<PaginatedDestructionListItems>(
    FIXTURE_PAGINATED_DESTRUCTION_LIST_ITEMS,
  );
