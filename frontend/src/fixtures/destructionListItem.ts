import {
  DestructionListItem,
  PaginatedDestructionListItems,
} from "../lib/api/destructionListsItem";
import { RecursivePartial } from "../lib/types/utilities";
import { createArrayFactory, createObjectFactory } from "./factory";
import { zaakFactory } from "./zaak";

export const FIXTURE_DESTRUCTION_LIST_ITEM: DestructionListItem = {
  pk: 1,
  status: "suggested",
  extraZaakData: null,
  zaak: zaakFactory(),
  processingStatus: "new",
  plannedDestructionDate: null,
  reviewAdviceIgnored: null,
  reviewResponseComment: "",
};
export const FIXTURE_DESTRUCTION_LIST_ITEM_DELETED: DestructionListItem = {
  pk: 2,
  status: "suggested",
  extraZaakData: null,
  zaak: null,
  processingStatus: "succeeded",
  plannedDestructionDate: "2026-01-01T00:00:00Z",
  reviewAdviceIgnored: null,
  reviewResponseComment: "",
};
export const FIXTURE_DESTRUCTION_LIST_ITEM_FAILED: DestructionListItem = {
  pk: 3,
  status: "suggested",
  extraZaakData: null,
  zaak: zaakFactory(),
  processingStatus: "failed",
  plannedDestructionDate: "2026-01-01T00:00:00Z",
  reviewAdviceIgnored: null,
  reviewResponseComment: "",
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

export const paginatedDestructionListItemsFactory = (
  overrides?: RecursivePartial<PaginatedDestructionListItems>,
) => {
  const data = createObjectFactory<PaginatedDestructionListItems>(
    FIXTURE_PAGINATED_DESTRUCTION_LIST_ITEMS,
  )();
  if (overrides?.count && overrides.count > 1) {
    data.count = overrides.count;
    data.results = new Array(overrides.count).fill(null).map((_, i) => {
      const uuid = `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`.replaceAll(
        "X",
        i.toString(),
      );
      return destructionListItemFactory({
        pk: i + 1,
        zaak: zaakFactory({
          identificatie: `ZAAK-${uuid}`,
          url: `http://zaken.nl/api/v1/zaken/${uuid}/`,
          uuid: uuid,
        }),
      });
    });
  }
  return data;
};

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
