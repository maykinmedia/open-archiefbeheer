import {
  AttributeTable,
  Body,
  Form,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useState } from "react";
import { useActionData, useNavigation } from "react-router-dom";

import { useSubmitAction } from "../../../../../hooks";
import { User } from "../../../../../lib/api/auth";
import {
  DestructionListAssignee,
  DestructionListAssigneeUpdate,
} from "../../../../../lib/api/destructionLists";
import { formatUser } from "../../../utils";
import {
  DestructionListUpdateAssigneesActionPayload,
  UpdateDestructionListAction,
} from "../../DestructionListDetail.action";

export type DestructionListAssigneesProps = {
  assignees: DestructionListAssignee[];
  reviewers: User[];
};

/**
 * Allows viewing/assigning the reviewers of a destruction list.
 * @param assignees
 * @param reviewers
 */
export function DestructionListAssignees({
  assignees,
  reviewers,
}: DestructionListAssigneesProps) {
  const { state } = useNavigation();
  const errors = useActionData() || {};
  const submitAction = useSubmitAction();

  const reviewerAssignees = [...assignees].filter((a) => a.role === "reviewer");

  type TempAction = Omit<
    DestructionListUpdateAssigneesActionPayload,
    "payload"
  > & {
    payload: Omit<
      DestructionListUpdateAssigneesActionPayload["payload"],
      "comment"
    >;
  };

  const [confirmationModalState, setConfirmationModalState] = useState<
    | {
        open: false;
        action?: TempAction;
      }
    | {
        open: true;
        action: TempAction;
      }
  >({
    open: false,
  });

  const fields = reviewerAssignees
    .filter((r) => r.user.role.canReviewDestruction)
    .map((_, i) => ({
      name: `reviewer_${i + 1}`,
      type: "string",
      options: reviewers.map((user) => ({
        label: formatUser(user),
      })),
    }));

  const labeledObject = reviewerAssignees.reduce((acc, val, i) => {
    const modalAssignee =
      confirmationModalState.action?.payload.assignees[i].user;
    const user =
      assignees.find((a) => a.user.pk === modalAssignee)?.user ??
      reviewerAssignees[i].user;
    return {
      ...acc,
      [`reviewer_${i + 1}`]: {
        label: `Beoordelaar ${i + 1}`,
        value: formatUser(user),
      },
    };
  }, {});
  /**
   * Gets called when the reviewers are reassigned, opens the confirmation modal.
   * @param _
   * @param data
   */
  const handleInitialSubmit = (_: FormEvent, data: SerializedFormData) => {
    const assignees: DestructionListAssigneeUpdate[] = Object.values(data).map(
      (formattedUser) => {
        const user = reviewers.find(
          (u) => formatUser(u) === formattedUser,
        ) as User;
        return { user: user.pk };
      },
    );

    setConfirmationModalState({
      open: true,
      action: {
        type: "UPDATE_ASSIGNEES",
        payload: { assignees },
      },
    });
  };
  /**
   * Gets called when the change is confirmed.
   * @param _
   * @param data
   */
  const handleModalSubmit = (_: FormEvent, { comment }: SerializedFormData) => {
    if (!confirmationModalState.open) {
      return;
    }
    const action = confirmationModalState.action;
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
              onSubmit={handleModalSubmit}
            />
          </Body>
        </Modal>
      )}

      <AttributeTable
        editable={state !== "submitting"} // TODO: "Editing" prop
        fields={fields}
        labeledObject={labeledObject}
        formProps={{
          labelSubmit: "Toewijzen",
          nonFieldErrors: errors
            ? Object.values(errors).length
              ? Object.values(errors)
              : undefined
            : undefined,
          onSubmit: handleInitialSubmit,
        }}
      />
    </>
  );
}
