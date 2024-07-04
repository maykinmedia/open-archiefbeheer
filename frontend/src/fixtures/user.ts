import { User } from "../lib/api/auth";

export const FIXTURE_RECORD_MANAGER: User = {
  pk: 1,
  username: "Record Manager",
  firstName: "Record",
  lastName: "Manager",
  email: "recordmanager@example.com",
  role: {
    name: "recordmanager",
    canStartDestruction: true,
    canReviewDestruction: false,
    canViewCaseDetails: false,
  },
};

export const FIXTURE_BEOORDELAAR: User = {
  pk: 2,
  username: "Beoor del Laar",
  firstName: "Beoor",
  lastName: "del Laar",
  email: "beoordelaar@example.com",
  role: {
    name: "beoordelaar",
    canStartDestruction: false,
    canReviewDestruction: true,
    canViewCaseDetails: false,
  },
};

export const FIXTURE_PROCES_EIGENAAR: User = {
  pk: 3,
  username: "Proces ei Genaar",
  firstName: "Proces",
  lastName: "ei Genaar",
  email: "proceseigenaar@example.com",
  role: {
    name: "proceseigenaar",
    canStartDestruction: false,
    canReviewDestruction: true,
    canViewCaseDetails: false,
  },
};

export const FIXTURE_USERS = [
  FIXTURE_RECORD_MANAGER,
  FIXTURE_BEOORDELAAR,
  FIXTURE_PROCES_EIGENAAR,
];
