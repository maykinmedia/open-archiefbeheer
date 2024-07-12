import {
  Body,
  Form,
  FormField,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useLoaderData, useSubmit } from "react-router-dom";

import { getZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import "./DestructionListCreate.css";
import { DestructionListCreateContext } from "./DestructionListCreate.loader";
import { DestructionList } from "./components";

/** Used if session hash cannot be created. */
export const DEFAULT_STORAGE_KEY = "destruction-list-create";

/**
 * Destruction list creation page
 */
export function DestructionListCreatePage() {
  const { reviewers, selectedZaken, sessionHash, zaken } =
    useLoaderData() as DestructionListCreateContext;
  const submit = useSubmit();
  const [modalOpenState, setModalOpenState] = useState(false);
  const storageKey = sessionHash || DEFAULT_STORAGE_KEY;

  const onSubmitSelection = () => setModalOpenState(true);

  /**
   * Gets called when the form is submitted.
   */
  const onSubmitForm = async (event: FormEvent, data: SerializedFormData) => {
    const zaakSelection = await getZaakSelection(
      storageKey,
      Boolean(sessionHash),
    );
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
      required: false,
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
        storageKey={storageKey}
        zaken={zaken}
        selectedZaken={selectedZaken}
        title="Vernietigingslijst opstellen"
        onSubmitSelection={onSubmitSelection}
      />
    </>
  );
}
