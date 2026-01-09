import {
  FIXTURE_DESTRUCTION_LIST,
  FIXTURE_SELECTIELIJSTKLASSE_CHOICES,
  archivistFactory,
  auditLogFactory,
  coReviewsFactory,
  destructionListAssigneesFactory,
  destructionListFactory,
  paginatedZakenFactory,
  recordManagerFactory,
  userFactory,
  usersFactory,
  internalZaaktypeChoicesFactory,
} from "../src/fixtures";

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
  DESTRUCTION_LIST_BEHANDELEND_AFDELING_CHOICES: {
    url: "http://localhost:8000/api/v1/_retrieve-behandelend-afdeling-choices-choices/",
    method: "GET",
    status: 200,
    response: [],
  },
  DESTRUCTION_LIST_RESULTAATTYPE_CHOICES: {
    url: "http://localhost:8000/api/v1/_internal-resultaattype-choices/",
    method: "GET",
    status: 200,
    response: [],
  },
  DESTRUCTION_LIST_ZAAKTYPE_CHOICES: {
    url: "http://localhost:8000/api/v1/_zaaktypen-choices/?inDestructionList=00000000-0000-0000-0000-000000000000",
    method: "GET",
    status: 200,
    response: internalZaaktypeChoicesFactory(),
  },
  DESTRUCTION_SEARCH_ZAAKTYPE_CHOICES: {
    url: "http://localhost:8000/api/v1/_zaaktypen-choices/",
    method: "POST",
    status: 200,
    response: internalZaaktypeChoicesFactory(),
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
        processingStatus: "succeeded",
      }),
      // No planned destruction date
      destructionListFactory({
        name: "My tenth destruction list",
        status: "ready_to_delete",
        processingStatus: "processing",
        plannedDestructionDate: null,
      }),
      // Deleted but report failed
      destructionListFactory({
        name: "My eleventh destruction list",
        status: "deleted",
        processingStatus: "failed",
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
    url: "http://localhost:8000/api/v1/users?role=record_manager",
    method: "GET",
    status: 200,
    response: [recordManagerFactory()],
  },
  ARCHIVISTS: {
    url: "http://localhost:8000/api/v1/users?role=archivist",
    method: "GET",
    status: 200,
    response: [archivistFactory()],
  },
  REVIEWERS: {
    url: "http://localhost:8000/api/v1/users?role=main_reviewer",
    method: "GET",
    status: 200,
    response: usersFactory(),
  },
  CO_REVIEWERS: {
    url: "http://localhost:8000/api/v1/users?role=co_reviewer",
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
  INTERNAL_SELECTIE_LIJST_CHOICES: {
    url: "http://localhost:8000/api/v1/_internal-selectielijstklasse-choices/",
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
    url: "http://localhost:8000/api/v1/_zaaktypen-choices/",
    method: "GET",
    status: 200,
    response: internalZaaktypeChoicesFactory(),
  },
  ZAAKTYPE_CHOICES_POST: {
    url: "http://localhost:8000/api/v1/_zaaktypen-choices/",
    method: "POST",
    status: 200,
    response: internalZaaktypeChoicesFactory(),
  },
  ZAAKTYPE_CHOICES_IN_REVIEW: {
    url: "http://localhost:8000/api/v1/_zaaktypen-choices/?inReview=1",
    method: "GET",
    status: 200,
    response: internalZaaktypeChoicesFactory(),
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
  // ZAKEN
  ZAKEN_SEARCH: {
    url: "http://localhost:8000/api/v1/zaken/search/",
    method: "POST",
    status: 200,
    response: paginatedZakenFactory(),
  },
  HEALTH_CHECK: {
    url: "http://localhost:8000/api/v1/health-check",
    method: "GET",
    status: 200,
    response: {
      success: true,
      errors: [],
    },
  },
};

export const MOCK_BASE = Object.values(MOCKS);
