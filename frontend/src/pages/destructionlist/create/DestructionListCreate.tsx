import {
  Body,
  ButtonProps,
  Form,
  FormField,
  Modal,
  SerializedFormData,
  Solid,
  date2DateString,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const submitAction = useSubmitAction<DestructionListCreateAction>();

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

    if (showUnarchivableZaken()) {
      actions.push({
        children: (
          <>
            <Solid.ArchiveBoxArrowDownIcon />
            Toon enkel zaken met verlopen archiefdatum
          </>
        ),
        disabled: false,
        variant: "info",
        onClick: handleFilterClick,
      });
    }

    if (onlyShowArchivableZaken()) {
      actions.push({
        children: (
          <>
            <Solid.ArchiveBoxArrowDownIcon />
            Toon ook zaken met toekomstige archiefdatum
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
   * Returns true if the "Toon enkel zaken met verlopen archiefdatum" filter is
   * active.
   *
   * This happens when:
   * - The user did NOT set a "archiefactiedatum__gte" filter
   * - AND the "archiefactiedatum__lte" filter is set
   * - AND the "archiefactiedatum__lte" date is in the past or today.
   *
   * This indicates that the user clicked the "Toon enkel zaken met verlopen archiefdatum"
   * button.
   */
  const onlyShowArchivableZaken = () => {
    if (searchParams.get("archiefactiedatum__gte")) return false; // User filtered.

    const strArchiveDateLte = searchParams.get("archiefactiedatum__lte");
    if (!strArchiveDateLte) return false;

    const dateArchiveDateLte = new Date(strArchiveDateLte);
    const today = new Date();

    return dateArchiveDateLte <= today;
  };

  /**
   * Returns true if there is no active "archiefactiedatum" filter.
   * This happens when both "archiefactiedatum__gte" and "archiefactiedatum__lte"
   * are omitted.
   *
   * This indicates that the user has not applied any archiefactiedatum filtering,
   * so the "Toon enkel zaken met verlopen archiefdatum" button should be shown.
   */
  const showUnarchivableZaken = () => {
    if (
      searchParams.get("archiefactiedatum__lte") ||
      searchParams.get("archiefactiedatum__gte")
    ) {
      return false;
    }
    return true;
  };

  /**
   * Gets called when the "Vernietigingslijst opstellen" button is clicked.
   */
  const handleCreateClick = () => setModalOpenState(true);

  /**
   * Get called when the "Toon zaken met verlopen archiefdatum" button is clicked.
   */
  const handleFilterClick = () => {
    if (onlyShowArchivableZaken()) {
      searchParams.delete("archiefactiedatum__lte");
      searchParams.delete("archiefactiedatum__gte");
      setSearchParams(searchParams);
      return;
    }
    searchParams.delete("archiefactiedatum__gte");
    searchParams.set("archiefactiedatum__lte", date2DateString(new Date()));
    setSearchParams(searchParams);
  };

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
        paginatedZaken={paginatedZaken}
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
