import {
  Body,
  Form,
  FormField,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useLoaderData, useSubmit } from "react-router-dom";

import { User } from "../../../lib/api/auth";
import { PaginatedZaken } from "../../../lib/api/zaken";
import { getZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import "./DestructionListCreate.css";
import { DestructionList } from "./components";

/** We need a key to store the zaak selection to, however we don't have a destruction list name yet. */
export const DESTRUCTION_LIST_CREATE_KEY = "destruction-list-create";

export type DestructionListCreateContext = {
  reviewers: User[];
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
};

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
      .filter(([, selection]) => selection.selected)
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
