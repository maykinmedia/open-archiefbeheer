import {
  Body,
  Form,
  FormField,
  Modal,
  SerializedFormData,
  Solid,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import {
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "react-router-dom";

import "./DestructionListCreate.css";
import { DestructionListCreateContext } from "./DestructionListCreate.loader";
import { DestructionList } from "./components";

/** We need a key to store the zaak selection to, however we don't have a destruction list name yet. */
export const DESTRUCTION_LIST_CREATE_KEY = "destruction-list-create";

/**
 * Destruction list creation page
 */
export function DestructionListCreatePage() {
  const { reviewers, paginatedZaken, zaakSelection, allZakenSelected } =
    useLoaderData() as DestructionListCreateContext;

  const { assignees: errors } = (useActionData() || {}) as Record<
    string,
    Record<string, string | string[]>
  >;

  const submit = useSubmit();

  const [modalOpenState, setModalOpenState] = useState(false);
  const [searchParams] = useSearchParams();

  const onSubmitSelection = () => setModalOpenState(true);

  /**
   * Gets called when the form is submitted.
   */
  const onSubmitForm = async (event: FormEvent, data: SerializedFormData) => {
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selection]) => selection.selected)
      .map(([url]) => url);
    const { name, assigneeId } = data;

    const formData = new FormData();
    formData.append("name", name as string);
    zaakUrls.forEach((url) => formData.append("zaakUrls", url));
    formData.append("assigneeId", JSON.stringify(assigneeId));

    const filters = Object.fromEntries(searchParams);
    formData.append("zaakFilters", JSON.stringify(filters));

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
      label: "Reviewer",
      name: "assigneeId",
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
        title="Vernietigingslijst opstellen"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            fields={modalFormFields}
            onSubmit={onSubmitForm}
            validateOnChange={true}
            labelSubmit="Vernietigingslijst opstellen"
          />
        </Body>
      </Modal>
      <DestructionList
        errors={errors?.nonFieldErrors}
        storageKey={DESTRUCTION_LIST_CREATE_KEY}
        zaken={paginatedZaken}
        zaakSelection={zaakSelection}
        allZakenSelected={allZakenSelected}
        title="Vernietigingslijst opstellen"
        labelAction={
          <>
            <Solid.DocumentPlusIcon />
            Vernietigingslijst opstellen
          </>
        }
        primaryActionDisabled={
          !allZakenSelected &&
          !Object.values(zaakSelection).filter((zs) => zs.selected).length
        }
        onSubmitSelection={onSubmitSelection}
      />
    </>
  );
}
