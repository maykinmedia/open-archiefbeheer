import { Option } from "@maykin-ui/admin-ui";

import { createArrayFactory } from "./factory";

const FIXTURE_ZAAKTYPE_CHOICE: Option = {
  label: "Aangifte behandelen 1",
  value:
    "http://localhost:8000/catalogi/api/v1/zaaktypen/64c98539-076e-4fbf-8fec-fa86c560fb24",
};

const FIXTURE_ZAAKTYPE_CHOICES: Option[] = [
  {
    label: "Aangifte behandelen 1",
    value:
      "http://localhost:8000/catalogi/api/v1/zaaktypen/64c98539-076e-4fbf-8fec-fa86c560fb24",
  },
  {
    label: "Aangifte behandelen 2",
    value:
      "http://localhost:8000/catalogi/api/v1/zaaktypen/927eb71c-d99b-4c5d-b3e2-94a07ce85923",
  },
  {
    label: "Aangifte behandelen 3",
    value:
      "http://localhost:8000/catalogi/api/v1/zaaktypen/684b9c68-a36f-4c72-b044-fa9cdcb17ec9",
  },
  {
    label: "Aangifte behandelen 4",
    value:
      "http://localhost:8000/catalogi/api/v1/zaaktypen/e4f2a6b0-9377-400a-b0ce-ed66c0a315da",
  },
  {
    label: "Aangifte behandelen 5",
    value:
      "http://localhost:8000/catalogi/api/v1/zaaktypen/3206d651-d0f2-4690-933d-cc690444184f",
  },
  {
    label: "Aangifte behandelen 6",
    value:
      "http://localhost:8000/catalogi/api/v1/zaaktypen/773b6b77-486a-4b6c-be3e-cf13f4387cf3",
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
