import { Option } from "@maykin-ui/admin-ui";

import { createArrayFactory, createObjectFactory } from "./factory";

export const FIXTURE_STATUSTYPE_CHOICES = [
  {
    label: "Statustype 1",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/feedf256-ef74-4d5f-8fc9-6891f58a0d1e",
  },
  {
    label: "Statustype 2",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/0b016f1a-e10a-4dad-9090-c06bac6ef7e7",
  },
  {
    label: "Statustype 3",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/155d0b58-c97d-4451-ab0c-a1fdbe65317c",
  },
  {
    label: "Statustype 4",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/2621072e-3d25-49fa-8e4c-e0797b1bebe9",
  },
  {
    label: "Statustype 5",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/e8f32e98-802b-4370-9f6b-dffbec588bb8",
  },
  {
    label: "Statustype 6",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/86f5402e-1b5b-4470-9d95-ed2f798deb03",
  },
  {
    label: "Statustype 7",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/6c875571-6ef1-4307-a1b6-c5a455fe647a",
  },
  {
    label: "Statustype 8",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/a318ed24-80ad-4da0-b95f-69913aef994f",
  },
  {
    label: "Statustype 9",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/56df165f-c657-44b1-a498-ea440e749b05",
  },
  {
    label: "Statustype 10",
    value:
      "http://zaken.nl/catalogi/api/v1/statustypen/03003779-800e-4951-844d-7478691cfd13",
  },
];

export const statusTypeChoiceFactory = createObjectFactory<
  Option<string, string>
>(FIXTURE_STATUSTYPE_CHOICES[0]);

export const statusTypeChoicesFactory = createArrayFactory<
  Option<string, string>
>(FIXTURE_STATUSTYPE_CHOICES);
