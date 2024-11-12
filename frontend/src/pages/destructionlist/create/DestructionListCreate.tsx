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
} from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import { formatUser } from "../../../lib/format/user";
import { BaseListView } from "../abstract";
import {
  DestructionListCreateAction,
  DestructionListCreateActionResponseData,
} from "./DestructionListCreate.action";
import { DestructionListCreateContext } from "./DestructionListCreate.loader";

/** We need a key to store the zaak selection to, however we don't have a destruction list name yet. */
export const DESTRUCTION_LIST_CREATE_KEY = "destruction-list-create";

/**
 * Destruction list creation page
 */
export function DestructionListCreatePage() {
  // Loader.
  const { reviewers, paginatedZaken } =
    useLoaderData() as DestructionListCreateContext;

  // Action.
  const { errors } = (useActionData() ||
    {}) as DestructionListCreateActionResponseData;

  const [modalOpenState, setModalOpenState] = useState(false);
  const [searchParams] = useSearchParams();
  const submitAction = useSubmitAction<DestructionListCreateAction>();

  /**
   * Gets called when the "Vernietigingslijst opstellen" is clicked
   */
  const handleClick = () => setModalOpenState(true);

  /**
   * Gets called when the form is submitted.
   */
  const handleSubmit = async (event: FormEvent, data: SerializedFormData) => {
    const { name, assigneeId, comment } = data as Record<string, string>;
    const zaakFilters = JSON.stringify(Object.fromEntries(searchParams));

    submitAction({
      type: "CREATE_LIST",
      payload: {
        name: name,
        assigneeId: assigneeId,
        comment: comment,
        zaakFilters: zaakFilters,
      },
    });

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
        label: formatUser(user),
      })),
      required: true,
    },
    {
      label: "Opmerking",
      name: "comment",
      required: false,
    },
  ];

  return (
    <>
      <BaseListView
        storageKey={DESTRUCTION_LIST_CREATE_KEY}
        title="Vernietigingslijst opstellen"
        errors={errors}
        paginatedZaken={paginatedZaken}
        allowSelectAllPages={true}
        selectionActions={[
          {
            children: (
              <>
                <Solid.DocumentPlusIcon />
                Vernietigingslijst opstellen
              </>
            ),
            variant: "primary",
            wrap: false,
            onClick: handleClick,
          },
        ]}
      />

      <Modal
        title="Vernietigingslijst opstellen"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            fields={modalFormFields}
            justify="stretch"
            onSubmit={handleSubmit}
            validateOnChange={true}
            labelSubmit="Vernietigingslijst opstellen"
          />
        </Body>
      </Modal>
    </>
  );
}
