import { Option } from "@maykin-ui/admin-ui";

import { createArrayFactory } from "./factory";

const FIXTURE_ZAAKTYPE_CHOICE: Option = {
  label: "Aangifte behandelen 1",
  value: "ZAAKTYPE-01",
};

const FIXTURE_ZAAKTYPE_CHOICES: Option[] = [
  {
    label: "Aangifte behandelen 1",
    value: "ZAAKTYPE-01",
  },
  {
    label: "Aangifte behandelen 2",
    value: "ZAAKTYPE-02",
  },
  {
    label: "Aangifte behandelen 3",
    value: "ZAAKTYPE-03",
  },
  {
    label: "Aangifte behandelen 4",
    value: "ZAAKTYPE-04",
  },
  {
    label: "Aangifte behandelen 5",
    value: "ZAAKTYPE-05",
  },
  {
    label: "Aangifte behandelen 6",
    value: "ZAAKTYPE-06",
  },
];

const FIXTURE_SHORT_PROCESS_ZAAKTYPE_CHOICES: Option[] = [
  {
    label: "Aangifte behandelen 1",
    value: "ZAAKTYPE-01",
  },
  {
    label: "Aangifte behandelen 2",
    value: "ZAAKTYPE-02",
  },
  {
    label: "Aangifte behandelen 3",
    value: "ZAAKTYPE-03",
  },
];

const FIXTURE_DESTRUCTION_REPORT_ZAAKTYPE_CHOICES: Option[] = [
  {
    label: "Aangifte behandelen 1",
    value:
      "http://zaken.nl/catalogi/api/v1/zaaktypen/bc30a34d-197f-4e63-91f8-892772311146",
  },
  {
    label: "Aangifte behandelen 2",
    value:
      "http://zaken.nl/catalogi/api/v1/zaaktypen/fb8bef7a-ba83-469e-aa9d-6bd1c2c45ca7",
  },
  {
    label: "Aangifte behandelen 3",
    value:
      "http://zaken.nl/catalogi/api/v1/zaaktypen/575dd69e-7ada-431f-8337-e3a70bf41511",
  },
];

const internalZaaktypeChoicesFactory = createArrayFactory<Option>(
  FIXTURE_ZAAKTYPE_CHOICES,
);

export {
  FIXTURE_ZAAKTYPE_CHOICE,
  FIXTURE_ZAAKTYPE_CHOICES,
  FIXTURE_DESTRUCTION_REPORT_ZAAKTYPE_CHOICES,
  FIXTURE_SHORT_PROCESS_ZAAKTYPE_CHOICES,
  internalZaaktypeChoicesFactory,
};
