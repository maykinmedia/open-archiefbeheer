import { Option } from "@maykin-ui/admin-ui";

import { createArrayFactory } from "./factory";
import { zakenFactory } from "./zaak";

const FIXTURE_SELECTIELIJSTKLASSE_CHOICES: Option[] = [
  {
    label: "1.1 - Ingericht - vernietigen - P10Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/afa30940-855b-4a7e-aa21-9e15a8078814",
  },
  {
    label: "1.1.1 - Ingericht - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/8af64c99-a168-40dd-8afd-9fbe0597b6dc",
  },
  {
    label: "1.1.2 - Ingericht - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/e84a06ac-1bdc-4e9c-9598-a22faa562459",
  },
  {
    label: "1.1.3 - Ingericht - vernietigen - P10Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/4086fe50-c79c-4d9b-90fc-71783f01c198",
  },
  {
    label: "1.2 - Ingesteld - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/ef6ec016-7747-4e71-b62f-d33cf90e0bc7",
  },
  {
    label: "1.3 - Opgeheven - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/784745d8-74d5-466c-93ff-6c1049364cb9",
  },
  {
    label: "1.4 - Niet doorgegaan - vernietigen - P5Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/4811c2bc-3255-4cd4-a00a-7ed59223b8b1",
  },
  {
    label: "1.5 - Afgebroken - vernietigen - P1Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/914f4198-3e73-497f-807f-1d17ee0af21f",
  },
];

const FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP = zakenFactory().reduce(
  (acc, val) => ({
    ...acc,
    [val.url as string]: FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  }),
  {},
);

const selectieLijstKlasseFactory = createArrayFactory<Option>(
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
);

export {
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES_MAP,
  selectieLijstKlasseFactory,
};
