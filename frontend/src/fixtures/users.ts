import { User } from "../lib/api/auth";

export const FIXTURE_USERS = [
  {
    pk: 1,
    username: "Chef Kok",
    firstName: "Chef",
    lastName: "Kok",
    email: "chefkok@example.com",
    role: {
      name: "recordmanager",
      canStartDestruction: true,
      canReviewDestruction: false,
      canViewCaseDetails: false,
    },
  },
] as User[];
