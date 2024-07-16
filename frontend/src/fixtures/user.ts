import { Role, User } from "../lib/api/auth";
import { createArrayFactory, createObjectFactory } from "./factory";

const FIXTURE_ROLE = {
  name: "Test Role",
  canStartDestruction: false,
  canReviewDestruction: false,
  canReviewFinalList: false,
  canViewCaseDetails: true,
};
export const roleFactory = createObjectFactory<Role>(FIXTURE_ROLE);

const FIXTURE_USER: User = {
  pk: 1,
  username: "testuser",
  firstName: "Test",
  lastName: "User",
  email: "user@example.com",
  role: roleFactory(),
};

const FIXTURE_RECORD_MANAGER: User = {
  pk: 1,
  username: "Record Manager",
  firstName: "Record",
  lastName: "Manager",
  email: "recordmanager@example.com",
  role: {
    name: "recordmanager",
    canStartDestruction: true,
    canReviewDestruction: false,
    canReviewFinalList: false,
    canViewCaseDetails: false,
  },
};

const FIXTURE_BEOORDELAAR: User = {
  pk: 2,
  username: "Beoor del Laar",
  firstName: "Beoor",
  lastName: "del Laar",
  email: "beoordelaar@example.com",
  role: {
    name: "beoordelaar",
    canStartDestruction: false,
    canReviewDestruction: true,
    canReviewFinalList: false,
    canViewCaseDetails: false,
  },
};

const FIXTURE_PROCES_EIGENAAR: User = {
  pk: 3,
  username: "Proces ei Genaar",
  firstName: "Proces",
  lastName: "ei Genaar",
  email: "proceseigenaar@example.com",
  role: {
    name: "proceseigenaar",
    canStartDestruction: false,
    canReviewDestruction: true,
    canReviewFinalList: false,
    canViewCaseDetails: false,
  },
};

const userFactory = createObjectFactory<User>(FIXTURE_USER);
const recordManagerFactory = createObjectFactory<User>(FIXTURE_RECORD_MANAGER);
const beoordelaarFactory = createObjectFactory<User>(FIXTURE_BEOORDELAAR);
const procesEigenaarFactory = createObjectFactory<User>(
  FIXTURE_PROCES_EIGENAAR,
);

const defaultUsers: User[] = [
  recordManagerFactory(),
  beoordelaarFactory(),
  procesEigenaarFactory(),
];

const usersFactory = createArrayFactory(defaultUsers);

export {
  beoordelaarFactory,
  procesEigenaarFactory,
  recordManagerFactory,
  userFactory,
  usersFactory,
};
