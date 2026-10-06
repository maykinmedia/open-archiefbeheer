import { SelectielijstklasseOption } from "../lib/api/types";
import { createArrayFactory } from "./factory";

const FIXTURE_SELECTIELIJSTKLASSE_CHOICES: SelectielijstklasseOption[] = [
  {
    label: "1.1 - Ingericht - vernietigen - P10Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/afa30940-855b-4a7e-aa21-9e15a8078814",
    extraData: {
      bewaartermijn: "P10Y",
      resultaattypen: [],
    },
  },
  {
    label: "1.1.1 - Ingericht - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/8af64c99-a168-40dd-8afd-9fbe0597b6dc",
    extraData: {
      bewaartermijn: null,
      resultaattypen: [],
    },
  },
  {
    label: "1.1.2 - Ingericht - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/e84a06ac-1bdc-4e9c-9598-a22faa562459",
    extraData: {
      bewaartermijn: null,
      resultaattypen: [],
    },
  },
  {
    label: "1.1.3 - Ingericht - vernietigen - P10Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/4086fe50-c79c-4d9b-90fc-71783f01c198",
    extraData: {
      bewaartermijn: "P10Y",
      resultaattypen: [],
    },
  },
  {
    label: "1.2 - Ingesteld - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/ef6ec016-7747-4e71-b62f-d33cf90e0bc7",
    extraData: {
      bewaartermijn: null,
      resultaattypen: [],
    },
  },
  {
    label: "1.3 - Opgeheven - blijvend_bewaren",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/784745d8-74d5-466c-93ff-6c1049364cb9",
    extraData: {
      bewaartermijn: null,
      resultaattypen: [],
    },
  },
  {
    label: "1.4 - Niet doorgegaan - vernietigen - P5Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/4811c2bc-3255-4cd4-a00a-7ed59223b8b1",
    extraData: {
      bewaartermijn: "P5Y",
      resultaattypen: [],
    },
  },
  {
    label: "1.5 - Afgebroken - vernietigen - P1Y",
    value:
      "https://selectielijst.openzaak.nl/api/v1/resultaten/914f4198-3e73-497f-807f-1d17ee0af21f",
    extraData: {
      bewaartermijn: "P1Y",
      resultaattypen: [],
    },
  },
];

const selectieLijstKlasseFactory =
  createArrayFactory<SelectielijstklasseOption>(
    FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  );

export { FIXTURE_SELECTIELIJSTKLASSE_CHOICES, selectieLijstKlasseFactory };
