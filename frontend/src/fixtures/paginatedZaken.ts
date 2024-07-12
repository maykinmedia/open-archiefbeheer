import { PaginatedZaken } from "../lib/api/zaken";
import { createObjectFactory } from "./factory";
import { zakenFactory } from "./zaak";

const FIXTURE_PAGINATED_ZAKEN = {
  count: 10,
  next: null,
  previous: null,
  results: zakenFactory(),
};

const paginatedZakenFactory = createObjectFactory<PaginatedZaken>(
  FIXTURE_PAGINATED_ZAKEN,
);

export { paginatedZakenFactory };
