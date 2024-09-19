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
  plannedDestructionDate: null,
};
export const FIXTURE_DESTRUCTION_LIST_ITEM_DELETED: DestructionListItem = {
  pk: 2,
  status: "suggested",
  extraZaakData: null,
  zaak: null,
  processingStatus: "succeeded",
  plannedDestructionDate: null,
};
export const FIXTURE_DESTRUCTION_LIST_ITEM_FAILED: DestructionListItem = {
  pk: 3,
  status: "suggested",
  extraZaakData: null,
  zaak: zaakFactory(),
  processingStatus: "failed",
  plannedDestructionDate: null,
};

export const destructionListItemFactory = createObjectFactory(
  FIXTURE_DESTRUCTION_LIST_ITEM,
);
export const destructionListItemsFactory = createArrayFactory([
  FIXTURE_DESTRUCTION_LIST_ITEM,
]);
export const destructionListItemsFailedFactory = createArrayFactory([
  FIXTURE_DESTRUCTION_LIST_ITEM_FAILED,
  FIXTURE_DESTRUCTION_LIST_ITEM_DELETED,
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

const FIXTURE_PAGINATED_DESTRUCTION_LIST_ITEMS_FAILED = {
  count: 2,
  next: null,
  previous: null,
  results: destructionListItemsFailedFactory(),
};

export const paginatedDestructionListItemsFailedFactory =
  createObjectFactory<PaginatedDestructionListItems>(
    FIXTURE_PAGINATED_DESTRUCTION_LIST_ITEMS_FAILED,
  );
