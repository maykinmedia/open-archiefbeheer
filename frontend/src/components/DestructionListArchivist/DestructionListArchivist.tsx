import {
  AttributeTable,
  Button,
  FormField,
  FormValidator,
  P,
  Solid,
  useAlert,
  useFormDialog,
  validateForm,
} from "@maykin-ui/admin-ui";
import { useEffect, useMemo, useState } from "react";
import { useNavigation, useRevalidator } from "react-router-dom";

import { useDataFetcher } from "../../hooks/useDataFetcher";
import { listArchivists } from "../../lib/api/archivist";
import { whoAmI } from "../../lib/api/auth";
import {
  DestructionList,
  updateAssigneeDestructionList,
} from "../../lib/api/destructionLists";
import { canReassignDestructionList } from "../../lib/auth/permissions";
import { collectErrors } from "../../lib/format/error";
import { formatUser } from "../../lib/format/user";

export type DestructionListArchivistProps = {
  destructionList: DestructionList;
};

export type DestructionListArchivistFormType = {
  archivist: string;
  comment: string;
};

export function DestructionListArchivist({
  destructionList,
}: DestructionListArchivistProps) {
  const alert = useAlert();
  const { state } = useNavigation();
  const revalidator = useRevalidator();

  const formDialog = useFormDialog<DestructionListArchivistFormType>();
  const { data: archivarissen } = useDataFetcher(
    listArchivists,
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de archivarissen!",
      initialState: [],
    },
    [],
  );
  const { data: user } = useDataFetcher(
    (signal) => whoAmI(signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de huidige gebruiker!",
      initialState: null,
    },
    [],
  );
  const [assignArchivistModalOpenState, setAssignArchivistModalOpenState] =
    useState(false);
  const [assignArchivistFormState, setAssignArchivistFormState] = useState<{
    archivist: string;
    comment: string;
  }>({ archivist: "", comment: "" });

  const fields = useMemo<FormField[]>(() => {
    const archivistField = {
      label: "Archivaris",
      name: "archivist",
      type: "string",
      options: archivarissen.map((u) => ({
        label: formatUser(u),
        value: u.pk,
      })),
      required: true,
      value: assignArchivistFormState.archivist,
    };

    const commentField = {
      autoFocus: true,
      label: "Reden",
      name: "comment",
      type: "text",
      required: true,
      value: assignArchivistFormState.comment,
    };

    return [archivistField, commentField];
  }, [assignArchivistModalOpenState, assignArchivistFormState.archivist]);

  const handleValidate: FormValidator = (values, _, validators) => {
    const _values = Object.assign({ ...assignArchivistFormState }, values);
    if (Object.keys(_values).length) {
      setAssignArchivistFormState(_values as typeof assignArchivistFormState);
    }
    return validateForm(_values, fields, validators);
  };

  const handleSubmit = (data: DestructionListArchivistFormType) => {
    const { archivist, comment } = data;
    setAssignArchivistModalOpenState(false);

    updateAssigneeDestructionList(destructionList.uuid, {
      assignee: { user: Number(archivist), role: "archivist" },
      comment: String(comment),
    })
      .catch(async (e) => {
        console.error(e);
        try {
          const data = await e.json();
          const errors = collectErrors(data).join("\n");
          alert("Foutmelding", data.detail || errors, "Ok");
        } catch {
          alert(
            "Foutmelding",
            "Er is een fout opgetreden bij het bewerken van de archivaris!",
            "Ok",
          );
          return;
        }
      })
      .then(() => revalidator.revalidate());
  };

  useEffect(() => {
    formDialog(
      "Archivaris toewijzen",
      null,
      fields,
      "Toewijzen",
      "Annuleren",
      handleSubmit,
      () => setAssignArchivistModalOpenState(false),
      {
        allowClose: true,
        open: assignArchivistModalOpenState,
        onClose: () => setAssignArchivistModalOpenState(false),
      },
      {
        validate: handleValidate,
      },
    );
  }, [assignArchivistModalOpenState, JSON.stringify(fields)]);

  const assignedArchivist = destructionList.assignees.find(
    (assignee) => assignee.role === "archivist",
  );

  return (
    <>
      {assignedArchivist && (
        <AttributeTable
          compact
          labeledObject={{
            reviewer: {
              label: "Archivaris",
              value: (
                <P>
                  {formatUser(assignedArchivist.user)}
                  {user &&
                    canReassignDestructionList(user, destructionList) && (
                      <>
                        &nbsp;
                        <Button
                          aria-label="Archivaris bewerken"
                          disabled={
                            state === "loading" || state === "submitting"
                          }
                          size="xs"
                          variant="secondary"
                          onClick={() => setAssignArchivistModalOpenState(true)}
                        >
                          <Solid.PencilIcon />
                        </Button>
                      </>
                    )}
                </P>
              ),
            },
          }}
        />
      )}
    </>
  );
}
