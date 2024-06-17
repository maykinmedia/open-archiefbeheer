import {
  Body,
  Form,
  FormField,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/router/utils";
import React, { FormEvent, useState } from "react";
import { redirect, useLoaderData, useSubmit } from "react-router-dom";

import { DestructionList } from "../../../components";
import { createDestructionList } from "../../../lib/api/destructionLists";
import { loginRequired } from "../../../lib/api/loginRequired";
import { User, listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  clearZaakSelection,
  getZaakSelection,
  isZaakSelected,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import "./DestructionListCreate.css";

/** We need a key to store the zaak selection to, however we don't have a destruction list name yet. */
const DESTRUCTION_LIST_CREATE_KEY = "destruction-list-create";

export type DestructionListCreateContext = {
  reviewers: User[];
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
};

/**
 * React Router loader.
 * @param request
 */
export const destructionListCreateLoader = loginRequired(
  async ({ request }: LoaderFunctionArgs) => {
    const searchParamsZakenEndpoint: Record<string, string> = {
      not_in_destruction_list: "true",
    };
    const searchParams = new URL(request.url).searchParams;
    Object.keys(searchParamsZakenEndpoint).forEach((key) =>
      searchParams.set(key, searchParamsZakenEndpoint[key]),
    );

    // Get reviewers, zaken and zaaktypen.
    const promises = [listReviewers(), listZaken(searchParams)];
    const [reviewers, zaken] = (await Promise.all(promises)) as [
      User[],
      PaginatedZaken,
    ];

    // Get zaak selection.
    const isZaakSelectedPromises = zaken.results.map((zaak) =>
      isZaakSelected(DESTRUCTION_LIST_CREATE_KEY, zaak),
    );
    const isZaakSelectedResults = await Promise.all(isZaakSelectedPromises);
    const selectedZaken = zaken.results.filter(
      (_, index) => isZaakSelectedResults[index],
    );

    return { reviewers, zaken, selectedZaken };
  },
);

/**
 * React Router action.
 * @param request
 */
export async function destructionListCreateAction({
  request,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const zaakUrls = formData.getAll("zaakUrls") as string[];
  const assigneeIds = formData.getAll("assigneeIds") as string[];

  try {
    await createDestructionList(name, zaakUrls, assigneeIds);
  } catch (e: unknown) {
    return await (e as Response).json();
  }
  await clearZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
  return redirect("/");
}

/**
 * Destruction list creation page
 */
export function DestructionListCreatePage() {
  const { reviewers, zaken, selectedZaken } =
    useLoaderData() as DestructionListCreateContext;
  const submit = useSubmit();

  const [modalOpenState, setModalOpenState] = useState(false);

  const onSubmitSelection = () => setModalOpenState(true);

  /**
   * Gets called when the form is submitted.
   */
  const onSubmitForm = async (event: FormEvent, data: SerializedFormData) => {
    const zaakSelection = await getZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selected]) => selected)
      .map(([url]) => url);
    const { name, assigneeIds } = data;

    const formData = new FormData();
    formData.append("name", name as string);
    zaakUrls.forEach((url) => formData.append("zaakUrls", url));
    (assigneeIds as string[]).forEach((id) =>
      formData.append("assigneeIds", String(id)),
    );

    submit(formData, { method: "POST" });
    setModalOpenState(false);
  };

  const modalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: modalOpenState,
      label: "Naam",
      name: "name",
      required: true,
    },
    {
      label: "Eerste reviewer",
      name: "assigneeIds",
      options: reviewers.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
    {
      label: "Tweede reviewer",
      name: "assigneeIds",
      options: reviewers.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
  ];

  return (
    <>
      <Modal
        title="Vernietigingslijst starten"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            fields={modalFormFields}
            onSubmit={onSubmitForm}
            validateOnChange={true}
          />
        </Body>
      </Modal>
      <DestructionList
        storageKey={DESTRUCTION_LIST_CREATE_KEY}
        zaken={zaken}
        selectedZaken={selectedZaken}
        title="Vernietigingslijst opstellen"
        onSubmitSelection={onSubmitSelection}
      />
    </>
  );
}
