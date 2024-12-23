import { auditLogFactory } from "../src/fixtures/auditLog";
import { coReviewsFactory } from "../src/fixtures/coReview";
import {
  FIXTURE_DESTRUCTION_LIST,
  destructionListAssigneesFactory,
  destructionListFactory,
} from "../src/fixtures/destructionList";
import { FIXTURE_SELECTIELIJSTKLASSE_CHOICES } from "../src/fixtures/selectieLijstKlasseChoices";
import {
  recordManagerFactory,
  userFactory,
  usersFactory,
} from "../src/fixtures/user";
import { zaaktypeChoicesFactory } from "../src/fixtures/zaaktypeChoices";

export const MOCKS = {
  // READS
  AUDIT_LOG: {
    url: "http://localhost:8000/api/v1/logs?destruction-list=00000000-0000-0000-0000-000000000000",
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
  DESTRUCTION_LISTS: {
    url: "http://localhost:8000/api/v1/destruction-lists/?ordering=-created",
    method: "GET",
    status: 200,
    response: [
      // New
      destructionListFactory({
        name: "My first destruction list",
        status: "new",
      }),
      destructionListFactory({
        name: "My second destruction list",
        status: "new",
      }),
      destructionListFactory({
        name: "My third destruction list",
        status: "new",
      }),
      // Changes requested
      destructionListFactory({
        name: "My fourth destruction list",
        status: "changes_requested",
      }),
      // Ready to review
      destructionListFactory({
        name: "My fifth destruction list",
        status: "ready_to_review",
      }),
      // Internally reviewed
      destructionListFactory({
        name: "My sixt destruction list",
        status: "internally_reviewed",
      }),
      // Ready for archivist
      destructionListFactory({
        name: "My seventh destruction list",
        status: "ready_for_archivist",
      }),
      // Ready to delete
      destructionListFactory({
        name: "My eighth destruction list",
        status: "ready_to_delete",
      }),
      // Deleted
      destructionListFactory({
        name: "My ninth destruction list",
        status: "deleted",
      }),
    ],
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
  USERS: {
    url: "http://localhost:8000/api/v1/users/",
    method: "GET",
    status: 200,
    response: usersFactory(),
  },
  RECORD_MANAGERS: {
    url: "http://localhost:8000/api/v1/record-managers/",
    method: "GET",
    status: 200,
    response: [recordManagerFactory()],
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

  // WRITES
  DESTRUCTION_LIST_CREATE: {
    url: "http://localhost:8000/api/v1/destruction-lists/",
    method: "POST",
    status: "201",
    response: FIXTURE_DESTRUCTION_LIST,
  },
  DESTRUCTION_LIST_UPDATE: {
    url: "http://localhost:8000/api/v1/destruction-lists/undefined", // FIXME
    method: "PATCH",
    status: "200",
    response: FIXTURE_DESTRUCTION_LIST,
  },
  DESTRUCTION_LIST_QUEUE_DESTRUCTION: {
    url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/queue_destruction/",
    method: "POST",
    status: "200",
    response: {},
  },
  DESTRUCTION_LIST_PROCESS_ABORT: {
    url: "http://localhost:8000/api/v1/destruction-lists/00000000-0000-0000-0000-000000000000/abort",
    method: "POST",
    status: "200",
    response: {},
  },
  REVIEW_RESPONSE_CREATE: {
    url: "http://localhost:8000/api/v1/review-responses/",
    method: "POST",
    status: "201",
    response: {},
  },
};

export const MOCK_BASE = Object.values(MOCKS);
