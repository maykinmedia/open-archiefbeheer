import { Option } from "@maykin-ui/admin-ui";

import { createArrayFactory, createObjectFactory } from "./factory";

export const FIXTURE_RESULTAATTYPE_CHOICES = [
  {
    label: "resultaattype 1",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/73c8a575-c75c-4c97-ba1f-42c3180ced04",
  },
  {
    label: "resultaattype 2",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/2af00ef7-d865-4166-9efc-19ab95fed618",
  },
  {
    label: "resultaattype 3",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/6436c0b9-156a-4e71-8aab-0e03cca85cc6",
  },
  {
    label: "resultaattype 4",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/ecf89355-866d-4d26-983d-48b9d3883441",
  },
  {
    label: "resultaattype 5",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/95ffea1c-0e11-4484-9352-cc60bf8c0ae1",
  },
  {
    label: "resultaattype 6",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/ee3f3076-c818-4176-ba5f-8e1a02cd5eaf",
  },
  {
    label: "resultaattype 7",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/36367e96-bfb0-4765-a4ef-735da326a9fc",
  },
  {
    label: "resultaattype 8",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/1a810166-a7cd-421d-b3b8-52e59d6b5957",
  },
  {
    label: "resultaattype 9",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/1ac42262-dbb8-49bd-a059-3e54752bdb74",
  },
  {
    label: "resultaattype 10",
    value:
      "http://zaken.nl/catalogi/api/v1/resultaattypen/4d453f16-04e7-4832-9e90-e59fda7e198d",
  },
];

export const resultaatTypeChoiceFactory = createObjectFactory<
  Option<string, string>
>(FIXTURE_RESULTAATTYPE_CHOICES[0]);

export const resultaatTypeChoicesFactory = createArrayFactory<
  Option<string, string>
>(FIXTURE_RESULTAATTYPE_CHOICES);
