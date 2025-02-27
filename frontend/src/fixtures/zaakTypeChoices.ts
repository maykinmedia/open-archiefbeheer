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

const zaaktypeChoiceFactory = createArrayFactory<Option>(
  FIXTURE_ZAAKTYPE_CHOICES,
);

const zaaktypeChoicesFactory = createArrayFactory<Option>(
  FIXTURE_ZAAKTYPE_CHOICES,
);

export {
  FIXTURE_ZAAKTYPE_CHOICE,
  FIXTURE_ZAAKTYPE_CHOICES,
  zaaktypeChoiceFactory,
  zaaktypeChoicesFactory,
};
