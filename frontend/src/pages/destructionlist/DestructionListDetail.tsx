import {
  AttributeData,
  AttributeTable,
  Body,
  CardBaseTemplate,
  Column,
  Container,
  Grid,
  H1,
} from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import { useLoaderData } from "react-router-dom";

import { loginRequired } from "../../lib/api/loginRequired";
import { request } from "../../lib/api/request";
import { Assignee, User } from "../../lib/api/reviewers";
import { Zaak } from "../../types";

export type DestructionListItem = {
  zaak: string;
  status: string;
  zaakData: Zaak;
};

export type DestructionListDetailContext = {
  name: string;
  author: User;
  items: DestructionListItem[];
  containsSensitiveInfo: boolean;
  status: string;
  assignees: Assignee[];
  assignee: User;
  created: string;
  statusChanged: string;
};

// Todo: should this come from the backend?
const STATUS_MAPPING: { [key: string]: string } = {
  in_progress: "In progress",
  processing: "Processing",
  completed: "Completed",
};

function formatUser(user: User) {
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName} (${user.username})`;
  return user.username;
}

function getDisplayableList(
  destructionList: DestructionListDetailContext,
): AttributeData {
  return {
    auteur: formatUser(destructionList.author),
    bevatGevoeligeInformatie: destructionList.containsSensitiveInfo,
    status: STATUS_MAPPING[destructionList.status],
    aangemaakt: destructionList.created,
  };
}

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const destructionList = useLoaderData() as DestructionListDetailContext;

  return (
    <CardBaseTemplate
      breadcrumbItems={[
        { label: "Vernietigingslijsten", href: "destruction-lists/" },
        { label: destructionList.name, href: "#" },
      ]}
    >
      <Body>
        <H1>{destructionList.name}</H1>
        <Grid>
          <Column span={6}>
            <AttributeTable object={getDisplayableList(destructionList)} />
          </Column>
          <Column span={6}>TODO</Column>
        </Grid>
      </Body>
    </CardBaseTemplate>
  );
}

export async function getDestructionList(id: string) {
  const response = await request("GET", `/destruction-lists/${id}`);
  const promise: Promise<User[]> = response.json();
  return promise;
}

export const destructionListDetailLoader = loginRequired(
  async ({ params }: ActionFunctionArgs) => {
    if (typeof params.id === "undefined") return;

    return await getDestructionList(params.id);
  },
);
