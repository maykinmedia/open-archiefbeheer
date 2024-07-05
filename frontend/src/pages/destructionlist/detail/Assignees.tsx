import {
  AttributeTable,
  Body,
  Form,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { bool } from "prop-types";
import React, { FormEvent, useState } from "react";
import { useActionData, useSubmit } from "react-router-dom";

import { DestructionListAssignee } from "../../../lib/api/destructionLists";
import { formatUser } from "../utils";
import { AssigneesEditableProps } from "./types";

export function AssigneesEditable({
  assignees,
  reviewers,
}: AssigneesEditableProps) {
  const errors = useActionData() || {};
  const submit = useSubmit();
  const reviewerAssignees = [...assignees].splice(1);
  const [confirmationModalState, setConfirmationModalState] = useState<{
    open: boolean;
    formData?: FormData;
  }>({
    open: false,
  });

  const fields = reviewerAssignees.map((_, i) => ({
    name: `reviewer_${i + 1}`,
    type: "string",
    options: reviewers.map((user) => ({
      label: formatUser(user),
    })),
  }));

  const labeledObject = reviewerAssignees.reduce(
    (acc, val, i) => ({
      ...acc,
      [`reviewer_${i + 1}`]: {
        label: `Beoordelaar ${i + 1}`,
        value: formatUser(assignees[i + 1].user),
      },
    }),
    {},
  );

  /**
   * Gets called when the reviewers are reassigned, opens the confirmation modal.
   * @param _
   * @param data
   */
  const handleSubmit = (_: FormEvent, data: SerializedFormData) => {
    const selectedAssignees: DestructionListAssignee[] = Object.values(
      data,
    ).map((username, i) => {
      const assignee = assignees.find(
        (assignee) => formatUser(assignee.user) === username,
      ) as DestructionListAssignee;
      return { ...assignee, order: i + 1 };
    });

    const assigneeIds = selectedAssignees.map((a) => a.user.pk);
    const formData = new FormData();
    assigneeIds.forEach((id) => formData.append("assigneeIds", id.toString()));
    setConfirmationModalState({ open: true, formData });
  };

  /**
   * Gets called when the change is confirmed.
   * @param _
   * @param data
   */
  const handleConfirm = (_: FormEvent, { comment }: SerializedFormData) => {
    const formData = confirmationModalState.formData as FormData;
    formData.set("comment", String(comment));
    submit(formData, { method: "PATCH" });
    setConfirmationModalState({ ...confirmationModalState, open: false });
  };

  return (
    <>
      {confirmationModalState.open && (
        <Modal
          open={confirmationModalState.open}
          size="m"
          title="Beoordelaars wijzigen"
          onClose={() => setConfirmationModalState({ open: false })}
        >
          <Body>
            <Form
              autoComplete="off"
              fields={[
                {
                  autoFocus: true,
                  label: "Reden",
                  name: "comment",
                  type: "text",
                  required: true,
                },
              ]}
              validateOnChange={true}
              onSubmit={handleConfirm}
            />
          </Body>
        </Modal>
      )}

      <AttributeTable
        editable={true}
        fields={fields}
        labeledObject={labeledObject}
        formProps={{
          labelSubmit: "Toewijzen",
          nonFieldErrors: errors
            ? Object.values(errors).length
              ? Object.values(errors)
              : undefined
            : undefined,
          onSubmit: handleSubmit,
        }}
      />
    </>
  );
}
