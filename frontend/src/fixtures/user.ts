import { Role, User } from "../lib/api/auth";
import { createArrayFactory, createObjectFactory } from "./factory";

const FIXTURE_ROLE = {
  canStartDestruction: false,
  canReviewDestruction: false,
  canCoReviewDestruction: false,
  canReviewFinalList: false,
  canConfigureApplication: false,
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
    canConfigureApplication: false,
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
    canConfigureApplication: false,
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
    canConfigureApplication: false,
  },
};

const FIXTURE_ARCHIVIST: User = {
  pk: 3,
  username: "Archivaris",
  firstName: "Archi",
  lastName: "Varis",
  email: "archivaris@example.com",
  role: {
    canStartDestruction: false,
    canReviewDestruction: true,
    canCoReviewDestruction: false,
    canReviewFinalList: true,
    canConfigureApplication: false,
  },
};

const FIXTURE_ADMINISTRATOR: User = {
  pk: 3,
  username: "Administrator",
  firstName: "Admi",
  lastName: "Nistrator",
  email: "administrator@example.com",
  role: {
    canStartDestruction: true,
    canReviewDestruction: true,
    canCoReviewDestruction: true,
    canReviewFinalList: true,
    canConfigureApplication: true,
  },
};

const userFactory = createObjectFactory<User>(FIXTURE_USER);
const recordManagerFactory = createObjectFactory<User>(FIXTURE_RECORD_MANAGER);
const beoordelaarFactory = createObjectFactory<User>(FIXTURE_BEOORDELAAR);
const procesEigenaarFactory = createObjectFactory<User>(
  FIXTURE_PROCES_EIGENAAR,
);
const archivistFactory = createObjectFactory<User>(FIXTURE_ARCHIVIST);
const administratorFactory = createObjectFactory<User>(FIXTURE_ADMINISTRATOR);

const defaultUsers: User[] = [
  recordManagerFactory(),
  beoordelaarFactory(),
  procesEigenaarFactory(),
  archivistFactory(),
  administratorFactory(),
];

const usersFactory = createArrayFactory(defaultUsers);

export {
  beoordelaarFactory,
  procesEigenaarFactory,
  recordManagerFactory,
  userFactory,
  usersFactory,
  archivistFactory,
  administratorFactory,
};
