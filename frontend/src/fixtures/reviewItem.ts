import { DestructionListItem } from "../lib/api/destructionListsItem";
import { ReviewItem } from "../lib/api/review";
import { Zaak } from "../types";
import { destructionListItemFactory } from "./destructionListItem";
import { createArrayFactory, createObjectFactory } from "./factory";
import { zaakFactory } from "./zaak";

const DESTRUCTION_LIST_ITEM_WITH_ZAAK = destructionListItemFactory({
  zaak: zaakFactory(),
}) as Omit<DestructionListItem, "zaak"> & { zaak: Zaak };

const FIXTURE_REVIEW_ITEM: ReviewItem = {
  pk: 1,
  destructionListItem: DESTRUCTION_LIST_ITEM_WITH_ZAAK,
  feedback: "Deze niet",
};

const FIXTURE_REVIEW_ITEMS: ReviewItem[] = [
  {
    pk: 1,
    destructionListItem: destructionListItemFactory({
      zaak: zaakFactory({
        identificatie: "ZAAK-2025-0000000000",
        url: "http://localhost:8000/zaken/api/v1/zaken/00000000-0000-0000-0000-000000000000",
        uuid: "00000000-0000-0000-0000-000000000000",
      }),
    }),
    feedback: "Deze ook niet",
  },
  {
    pk: 2,
    destructionListItem: destructionListItemFactory({
      zaak: zaakFactory({
        identificatie: "ZAAK-2025-0000000001",
        url: "http://localhost:8000/zaken/api/v1/zaken/11111111-1111-1111-1111-111111111111",
        uuid: "11111111-1111-1111-1111-111111111111",
      }),
    }),
    feedback: "Deze ook niet",
  },
  {
    pk: 3,
    destructionListItem: destructionListItemFactory({
      zaak: zaakFactory({
        identificatie: "ZAAK-2025-0000000002",
        url: "http://localhost:8000/zaken/api/v1/zaken/22222222-2222-2222-2222-222222222222",
        uuid: "22222222-2222-2222-2222-222222222222",
      }),
    }),
    feedback: "Deze nog niet",
  },
];

const reviewItemFactory = createObjectFactory<ReviewItem>(FIXTURE_REVIEW_ITEM);
const reviewItemsFactory = createArrayFactory<ReviewItem>(FIXTURE_REVIEW_ITEMS);

export { reviewItemFactory, reviewItemsFactory };
