import { Option } from "@maykin-ui/admin-ui";

import { createArrayFactory, createObjectFactory } from "./factory";

export const FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES = [
  {
    label: "Informatie object type 1",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/b0b28783-052d-414a-867d-81cf52725506",
  },
  {
    label: "Informatie object type 2",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/3007e984-c529-4a07-b32e-555b4c882ce5",
  },
  {
    label: "Informatie object type 3",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/b25201a6-2d1e-42ca-bff6-417ce5b4cb4a",
  },
  {
    label: "Informatie object type 4",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/4ff5a190-8dc8-4ee7-b018-92ae90f564bf",
  },
  {
    label: "Informatie object type 5",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/d2dc7b42-a3d6-42b8-90c5-d54342c02357",
  },
  {
    label: "Informatie object type 6",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/c91c1e80-78e9-417a-b828-4f5dbcfd12a7",
  },
  {
    label: "Informatie object type 7",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/5cff5507-bf01-4d02-9a60-292b254974f6",
  },
  {
    label: "Informatie object type 8",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/4616eb79-112f-4575-bd3a-2faa5fef31ab",
  },
  {
    label: "Informatie object type 9",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/bece20a5-8e01-4bc5-9ba0-7c853cff46a0",
  },
  {
    label: "Informatie object type 10",
    value:
      "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/09428c24-12e5-4c3a-a75c-e9e0d448a93b",
  },
];

export const informatieObjectTypeChoiceFactory = createObjectFactory<
  Option<string, string>
>(FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES[0]);

export const informatieObjectTypeChoicesFactory = createArrayFactory<
  Option<string, string>
>(FIXTURE_INFORMATIE_OBJECTTYPE_CHOICES);
