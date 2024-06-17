import {
  AttributeTable,
  Badge,
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

import {
  DestructionList,
  DestructionListItemUpdate,
  DestructionListUpdateData,
  getDestructionList,
  updateDestructionList,
} from "../../../lib/api/destructionLists";
import { loginRequired } from "../../../lib/api/loginRequired";
import { User, listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import { formatUser } from "../utils";
import { AssigneesEditable } from "./Assignees";
import "./DestructionListDetail.css";
import { DestructionListItems } from "./DestructionListItems";
import { STATUS_LEVEL_MAPPING, STATUS_MAPPING } from "./constants";
import { DestructionListDetailContext } from "./types";

function getDisplayableList(
  destructionList: DestructionList,
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
    status: {
      label: "Status",
      value: (
        <Badge level={STATUS_LEVEL_MAPPING[destructionList.status]}>
          {STATUS_MAPPING[destructionList.status]}
        </Badge>
      ),
    },
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

/**
 * React Router loader.
 */
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
    await updateDestructionList(params.uuid as string, data);
  } catch (e: unknown) {
    if (e instanceof Response) return await (e as Response).json();

    throw e;
  }

  return redirect(`/destruction-lists/${params.uuid}/`);
}

/**
 * React Router loader.
 */
export const destructionListDetailLoader = loginRequired(
  async ({
    request,
    params,
  }: ActionFunctionArgs): Promise<DestructionListDetailContext> => {
    console.log("loader", request, params);

    const storageKey = `destruction-list-detail-${params.uuid}`;
    const searchParamsZakenEndpoint: Record<string, string> = {
      not_in_destruction_list_except: String(params.uuid),
    };
    const searchParams = new URL(request.url).searchParams;
    Object.keys(searchParamsZakenEndpoint).forEach((key) =>
      searchParams.set(key, searchParamsZakenEndpoint[key]),
    );

    // Get reviewers, zaken and zaaktypen.
    const promises = [
      getDestructionList(params.uuid as string),
      listReviewers(),
      listZaken(searchParams),
    ];
    const [destructionList, reviewers, allZaken] = (await Promise.all(
      promises,
    )) as [DestructionList, User[], PaginatedZaken];

    return {
      allZaken,
      destructionList,
      storageKey,
      reviewers,
    };
  },
);
