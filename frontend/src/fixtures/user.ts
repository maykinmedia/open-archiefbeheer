import { Role, User } from "../lib/api/auth";
import { createArrayFactory, createObjectFactory } from "./factory";

const FIXTURE_ROLE = {
  canStartDestruction: false,
  canReviewDestruction: false,
  canCoReviewDestruction: true,
  canReviewFinalList: false,
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
    canStartDestruction: true,
    canReviewDestruction: false,
    canCoReviewDestruction: true,
    canReviewFinalList: false,
  },
};

const FIXTURE_BEOORDELAAR: User = {
  pk: 2,
  username: "Beoor del Laar",
  firstName: "Beoor",
  lastName: "del Laar",
  email: "beoordelaar@example.com",
  role: {
    canStartDestruction: false,
    canReviewDestruction: true,
    canCoReviewDestruction: true,
    canReviewFinalList: false,
  },
};

const FIXTURE_PROCES_EIGENAAR: User = {
  pk: 3,
  username: "Proces ei Genaar",
  firstName: "Proces",
  lastName: "ei Genaar",
  email: "proceseigenaar@example.com",
  role: {
    canStartDestruction: false,
    canReviewDestruction: true,
    canCoReviewDestruction: true,
    canReviewFinalList: false,
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
