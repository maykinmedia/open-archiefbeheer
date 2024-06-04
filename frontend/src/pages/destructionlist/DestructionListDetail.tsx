import {
  AttributeTable,
  Body,
  CardBaseTemplate,
  Column,
  Grid,
  H1,
  LabeledAttributeData,
  P,
} from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import React from "react";
import { redirect, useLoaderData } from "react-router-dom";

import { loginRequired } from "../../lib/api/loginRequired";
import { request } from "../../lib/api/request";
import { User } from "../../lib/api/reviewers";
import { AssigneesEditable } from "./Assignees";
import { getZakenData } from "./DestructionListCreate";
import "./DestructionListDetail.css";
import { DestructionListItems } from "./DestructionListItems";
import { STATUS_MAPPING } from "./constants";
import {
  DestructionListData,
  DestructionListDetailContext,
  DestructionListItemUpdate,
  DestructionListUpdateData,
} from "./types";
import { formatUser } from "./utils";

function getDisplayableList(
  destructionList: DestructionListData,
): LabeledAttributeData {
  const createdOn = new Date(destructionList.created);
  const formattedCreatedOn = createdOn.toLocaleString("nl-nl", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return {
    auteur: { label: "Auteur", value: formatUser(destructionList.author) },
    bevatGevoeligeInformatie: {
      label: "Bevat gevoelige informatie",
      value: destructionList.containsSensitiveInfo,
    },
    status: { label: "Status", value: STATUS_MAPPING[destructionList.status] },
    aangemaakt: {
      label: "Aangemaakt",
      value: formattedCreatedOn,
    },
  };
}

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { destructionList } = useLoaderData() as DestructionListDetailContext;

  // TODO - Make a 404 page
  if (!destructionList) return <div>Deze vernietigingslijst bestaat niet.</div>;

  return (
    <div className="destruction-list-detail">
      <CardBaseTemplate
        breadcrumbItems={[
          { label: "Vernietigingslijsten", href: "destruction-lists/" },
          { label: destructionList.name, href: "#" },
        ]}
      >
        <Body>
          <H1>{destructionList.name}</H1>
          <P>
            <Grid>
              <Column span={3}>
                <AttributeTable
                  labeledObject={getDisplayableList(destructionList)}
                />
              </Column>
              <Column span={9}>
                <AssigneesEditable assignees={destructionList.assignees} />
              </Column>
            </Grid>
          </P>
          <P>
            <DestructionListItems
              zaken={destructionList.items.map((item) => item.zaakData)}
              destructionList={destructionList}
            />
          </P>
        </Body>
      </CardBaseTemplate>
    </div>
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
  const assigneesData =
    formData.has("assigneeIds") && formData.getAll("assigneeIds");
  const items = formData.has("zaakUrls") && formData.getAll("zaakUrls");
  const data: DestructionListUpdateData = {};

  if (assigneesData) {
    data.assignees = assigneesData
      .filter((id) => id !== "") // Case in which a reviewer is removed
      .map((id, index) => ({
        user: Number(id),
        order: index,
      }));
  }

  if (items) {
    data.items = items.map((zaakUrl) => ({
      zaak: zaakUrl,
    })) as DestructionListItemUpdate[];
  }

  try {
    await updateDestructionList(params.id as string, data);
  } catch (e: unknown) {
    if (e instanceof Response) return await (e as Response).json();

    throw e;
  }

  return redirect(`/destruction-lists/${params.id}/`);
}

export const destructionListDetailLoader = loginRequired(
  async ({ request, params }: ActionFunctionArgs) => {
    if (typeof params.id === "undefined") return {};

    const promises = [
      getDestructionList(params.id),
      getZakenData(request, {
        not_in_destruction_list_except: String(params.id),
      }),
    ];

    const [destructionList, zakenListData] = await Promise.all(promises);

    return { destructionList, ...zakenListData };
  },
);
