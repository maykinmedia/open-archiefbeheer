import { userFactory } from "../src/fixtures/user";
import { whoAmI } from "../src/lib/api/auth";

export const MOCK_WHOAMI = {
  url: "http://localhost:8000/api/v1/whoami/?",
  method: "GET",
  status: 200, // Actually 204 but setting this causes an issue.
  response: userFactory(),
};

export const MOCK_ZAAKTYPE_CHOICES = {
  url: "http://localhost:8000/api/v1/_zaaktypen-choices?",
  method: "GET",
  status: 200,
  response: [
    {
      label: "Melding klein kansspel",
      value:
        "https://test.openzaak.nl/catalogi/api/v1/zaaktypen/e95d9bdf-588d-4965-a469-378d9e0ca91e",
      extra: "MKK",
    },
  ],
};

export const MOCKS_ZAAK_SELECTION = [
  {
    url: "http://localhost:8000/api/v1/zaak-selection/:key/?",
    method: "GET",
    status: 200,
    response: {
      key: "storybook-storage-key",
      lastUpdated: "",
      lastUpdatedBy: userFactory(),
      items: [],
    },
  },
  {
    url: "http://localhost:8000/api/v1/zaak-selection/:key/add_zaken/?",
    method: "PUT",
    status: 201,
    response: {},
  },
  {
    url: "http://localhost:8000/api/v1/zaak-selection/:key/remove_zaken/?",
    method: "DELETE",
    status: 200, // Actually 204 but setting this causes an issue.
    response: {},
  },
];

export const MOCKS_COMMON = [
  MOCK_WHOAMI,
  MOCK_ZAAKTYPE_CHOICES,
  ...MOCKS_ZAAK_SELECTION,
];
