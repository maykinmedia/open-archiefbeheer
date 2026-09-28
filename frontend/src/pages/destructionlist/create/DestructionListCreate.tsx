import {
  Body,
  ButtonProps,
  Form,
  FormField,
  Modal,
  SerializedFormData,
  Solid,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useActionData, useLoaderData, useSearchParams } from "react-router";

import { useSubmitAction } from "../../../hooks";
import { formatUser } from "../../../lib/format/user";
import { BaseListView } from "../abstract";
import {
  DestructionListCreateAction,
  DestructionListCreateActionResponseData,
} from "./DestructionListCreate.action";
import {
  getArchiveDateMode,
  getZaakFilters,
} from "./DestructionListCreate.filters";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const submitAction = useSubmitAction<DestructionListCreateAction>();

  const archiveDateMode = getArchiveDateMode(searchParams);

  /**
   * Gets called when the "Vernietigingslijst opstellen" button is clicked.
   */
  const handleCreateClick = () => setModalOpenState(true);

  /**
   * Get called when the "archiefactiedatum" search params are changed:
   *   - User clicks on "Toon enkel zaken met verlopen archiefdatum" OR
   *   - User clicks on "Toon ook zaken met toekomstige archiefdatum"
   */
  const handleFilterClick = () => {
    searchParams.delete("archiefactiedatum__lte");
    searchParams.delete("archiefactiedatum__gte");

    if (archiveDateMode === "past") {
      searchParams.set("showAll", "true");
    } else {
      searchParams.delete("showAll");
    }

    setSearchParams(searchParams);
  };

  const getSelectionActions = (): ButtonProps[] => {
    const actions: ButtonProps[] = [
      {
        children: (
          <>
            <Solid.DocumentPlusIcon />
            Vernietigingslijst opstellen
          </>
        ),
        variant: "primary",
        wrap: false,
        onClick: handleCreateClick,
      },
    ];

    if (archiveDateMode !== "custom") {
      actions.push({
        children: (
          <>
            <Solid.ArchiveBoxArrowDownIcon />
            {archiveDateMode === "all"
              ? "Toon enkel zaken met verlopen archiefdatum"
              : "Toon ook zaken met toekomstige archiefdatum"}
          </>
        ),
        disabled: false,
        variant: "info",
        onClick: handleFilterClick,
      });
    }

    return actions;
  };

  /**
   * Gets called when the form is submitted.
   */
  const handleSubmit = async (event: FormEvent, data: SerializedFormData) => {
    const { name, assigneeId, comment } = data as Record<string, string>;
    const zaakFilters = JSON.stringify(
      Object.fromEntries(getZaakFilters(searchParams)),
    );

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
      label: "Toelichting",
      name: "comment",
      required: true,
    },
  ];

  return (
    <>
      <BaseListView
        storageKey={DESTRUCTION_LIST_CREATE_KEY}
        title="Vernietigingslijst opstellen"
        errors={errors}
        paginatedObjectList={paginatedZaken}
        restrictFilterChoices="unassigned"
        allowSelectAllPages={true}
        selectionActions={getSelectionActions()}
      />

      <Modal
        title="Vernietigingslijst opstellen"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            aria-label="Vul vernietigingslijst eigenschappen in"
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
