import {
  AttributeTable,
  Body,
  CardBaseTemplate,
  Column,
  Grid,
  H1,
  H2,
  ObjectData,
} from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import React from "react";
import { redirect, useLoaderData } from "react-router-dom";

import { loginRequired } from "../../lib/api/loginRequired";
import { request } from "../../lib/api/request";
import { User } from "../../lib/api/reviewers";
import { AssigneesEditable } from "./Assignees";
import {
  DestructionListDetailContext,
  DestructionListUpdateData,
} from "./types";

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
): ObjectData {
  return {
    auteur: { label: "Auteur", value: formatUser(destructionList.author) },
    bevatGevoeligeInformatie: {
      label: "Bevat gevoelige informatie",
      value: destructionList.containsSensitiveInfo,
    },
    status: { label: "Status", value: STATUS_MAPPING[destructionList.status] },
    aangemaakt: { label: "Aangemaakt", value: destructionList.created },
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
          <Column span={6}>
            <AssigneesEditable assignees={destructionList.assignees} />
          </Column>
        </Grid>
        <H2>Zaakdossiers</H2>
      </Body>
    </CardBaseTemplate>
  );
}

export async function getDestructionList(id: string) {
  const response = await request("GET", `/destruction-lists/${id}`);
  const promise: Promise<User[]> = response.json();
  return promise;
}

export async function updateDestructionList(
  id: string,
  data: DestructionListUpdateData,
) {
  const response = await request(
    "PATCH",
    `/destruction-lists/${id}/`,
    {},
    data,
  );
  const promise: Promise<User[]> = response.json();
  return promise;
}

export async function destructionListUpdateAction({
  request,
  params,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const assigneesData = formData.getAll("assigneeIds");
  const data = {
    assignees: assigneesData.map((id, index) => ({
      user: Number(id),
      order: index,
    })),
  };

  try {
    await updateDestructionList(params.id as string, data);
  } catch (e: unknown) {
    return await (e as Response).json();
  }

  return redirect(`/destruction-lists/${params.id}/`);
}

export const destructionListDetailLoader = loginRequired(
  async ({ params }: ActionFunctionArgs) => {
    if (typeof params.id === "undefined") return;

    return await getDestructionList(params.id);
  },
);
