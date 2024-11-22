import { auditLogFactory } from "../src/fixtures/auditLog";
import { coReviewsFactory } from "../src/fixtures/coReview";
import { destructionListAssigneesFactory } from "../src/fixtures/destructionList";
import { FIXTURE_SELECTIELIJSTKLASSE_CHOICES } from "../src/fixtures/selectieLijstKlasseChoices";
import { userFactory, usersFactory } from "../src/fixtures/user";
import { zaaktypeChoicesFactory } from "../src/fixtures/zaaktypeChoices";

export const MOCKS = {
  AUDIT_LOG: {
    url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/auditlog/",
    method: "GET",
    status: 200,
    response: auditLogFactory(),
  },
  CO_REVIEWS: {
    url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000",
    method: "GET",
    status: 200,
    response: coReviewsFactory(),
  },
  CO_REVIEW_CREATE: {
    url: "http://localhost:8000/api/v1/destruction-list-co-reviews/?destructionList__uuid=00000000-0000-0000-0000-000000000000",
    method: "POST",
    status: 201,
    response: {},
  },
  DESTRUCTION_LIST_MAKE_FINAL: {
    url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/make_final",
    method: "POST",
    status: 201,
    response: {},
  },
  DESTRUCTION_LIST_CO_REVIEWERS: {
    url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/co-reviewers/",
    method: "GET",
    status: 200,
    response: destructionListAssigneesFactory(),
  },
  DESTRUCTION_LIST_ZAAKTYPE_CHOICES: {
    url: "http://localhost:8000/api/v1/_zaaktypen-choices/?inDestructionList=00000000-0000-0000-0000-000000000000",
    method: "GET",
    status: 200,
    response: zaaktypeChoicesFactory(),
  },
  OIDC_INFO: {
    url: "http://localhost:8000/api/v1/oidc-info",
    method: "GET",
    status: 200,
    response: {
      enabled: false,
      loginUrl: "http://www.example.com",
    },
  },
  REVIEWERS: {
    url: "http://localhost:8000/api/v1/reviewers/",
    method: "GET",
    status: 200,
    response: usersFactory(),
  },
  CO_REVIEWERS: {
    url: "http://localhost:8000/api/v1/co-reviewers/",
    method: "GET",
    status: 200,
    response: usersFactory(),
  },
  REVIEW_RESPONSES: {
    url: "http://localhost:8000/api/v1/review-responses/?review=1",
    method: "GET",
    status: 200,
    response: [],
  },
  SELECTIE_LIJST_CHOICES: {
    url: "http://localhost:8000/api/v1/_selectielijstklasse-choices/",
    method: "GET",
    status: 200,
    response: FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  },
  WHOAMI: {
    url: "http://localhost:8000/api/v1/whoami/",
    method: "GET",
    status: 200,
    response: userFactory(),
  },
  ZAAKTYPE_CHOICES: {
    url: "http://localhost:8000/api/v1/_zaaktypen-choices",
    method: "GET",
    status: 200,
    response: zaaktypeChoicesFactory(),
  },
  ZAAKTYPE_CHOICES_IN_REVIEW: {
    url: "http://localhost:8000/api/v1/_zaaktypen-choices/?inReview=1",
    method: "GET",
    status: 200,
    response: zaaktypeChoicesFactory(),
  },
};

export const MOCK_BASE = Object.values(MOCKS);
