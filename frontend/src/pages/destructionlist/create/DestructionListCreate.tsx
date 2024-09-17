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
import { getFilteredZaakSelection } from "../../../lib/zaakSelection/zaakSelection";
import { BaseListView } from "../abstract";
import { useZaakSelection } from "../hooks/useZaakSelection";
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

  // Returned zaak selection is page specific, don't use it as we need all selected zaken.
  const [, , { allPagesSelected, hasSelection }] = useZaakSelection(
    DESTRUCTION_LIST_CREATE_KEY,
    paginatedZaken.results,
  );

  /**
   * Gets called when the "Vernietigingslijst opstellen" is clicked
   */
  const handleClick = () => setModalOpenState(true);

  /**
   * Gets called when the form is submitted.
   */
  const handleSubmit = async (event: FormEvent, data: SerializedFormData) => {
    const { name, assigneeId } = data as Record<string, string>;
    const zaakFilters = JSON.stringify(Object.fromEntries(searchParams));

    const zaakUrls = Object.keys(
      await getFilteredZaakSelection(DESTRUCTION_LIST_CREATE_KEY),
    );

    submitAction({
      type: "CREATE_LIST",
      payload: {
        name: name,
        zaakUrls: zaakUrls,
        assigneeId: assigneeId,
        zaakFilters: zaakFilters,
        allPagesSelected: allPagesSelected,
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
        label: user.username,
      })),
      required: true,
    },
  ];

  return (
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
          disabled: !allPagesSelected && !hasSelection,

          variant: "primary",
          wrap: false,
          onClick: handleClick,
        },
      ]}
    >
      <Modal
        title="Vernietigingslijst opstellen"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            fields={modalFormFields}
            onSubmit={handleSubmit}
            validateOnChange={true}
            labelSubmit="Vernietigingslijst opstellen"
          />
        </Body>
      </Modal>
    </BaseListView>
  );
}
