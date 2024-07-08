import {
  AttributeTable,
  Body,
  Form,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useState } from "react";
import { useActionData } from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import { DestructionListAssignee } from "../../../lib/api/destructionLists";
import { formatUser } from "../utils";
import { UpdateDestructionListAction } from "./DestructionListDetail";
import { AssigneesEditableProps } from "./types";

export function AssigneesEditable({
  assignees,
  reviewers,
}: AssigneesEditableProps) {
  const errors = useActionData() || {};
  const submitAction = useSubmitAction();

  const reviewerAssignees = [...assignees].splice(1);
  const [confirmationModalState, setConfirmationModalState] = useState<{
    open: boolean;
    action?: UpdateDestructionListAction<
      Record<string, string | Array<number | string>>
    >;
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
    setConfirmationModalState({
      open: true,
      action: {
        type: "UPDATE_ASSIGNEES",
        payload: { assigneeIds },
      },
    });
  };

  /**
   * Gets called when the change is confirmed.
   * @param _
   * @param data
   */
  const handleConfirm = (_: FormEvent, { comment }: SerializedFormData) => {
    const action = confirmationModalState.action as UpdateDestructionListAction<
      Record<string, string | Array<number | string>>
    >;
    Object.assign(action.payload, { comment: String(comment) });

    submitAction(action);
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
