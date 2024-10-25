import {
  AttributeTable,
  Body,
  Button,
  Form,
  Modal,
  SerializedFormData,
  Solid,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useNavigation } from "react-router-dom";

import { useSubmitAction } from "../../hooks";
import { User } from "../../lib/api/auth";
import { DestructionList } from "../../lib/api/destructionLists";
import { formatUser } from "../../lib/format/user";

export type DestructionListReviewerProps = {
  destructionList: DestructionList;
  reviewers: User[];
};

/**
 * Allows viewing/assigning the reviewers of a destruction list.
 * @param destructionList
 * @param reviewers
 */
export function DestructionListReviewer({
  destructionList,
  reviewers,
}: DestructionListReviewerProps) {
  const { state } = useNavigation();
  const submitAction = useSubmitAction();
  const [modalState, setModalState] = useState<boolean>(false);

  /**
   * Gets called when the change is confirmed.
   * @param _
   * @param data
   */
  const handleSubmit = (
    _: FormEvent,
    { reviewer, comment }: SerializedFormData,
  ) => {
    if (!modalState) {
      return;
    }
    submitAction({
      type: "UPDATE_REVIEWER",
      payload: {
        assignee: { user: Number(reviewer) },
        comment: String(comment),
      },
    });
    setModalState(false);
  };

  const reviewer = destructionList.assignees.find(
    (assignee) => assignee.role === "reviewer",
  );

  return (
    <>
      {reviewer && (
        <>
          <AttributeTable
            labeledObject={{
              reviewer: {
                label: "Beoordelaar",
                value: (
                  <>
                    {formatUser(reviewer.user)}
                    &nbsp;
                    <Button
                      aria-label="Beoordelaar bewerken"
                      disabled={state === "loading" || state === "submitting"}
                      size="xs"
                      variant="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        setModalState(true);
                      }}
                    >
                      <Solid.PencilIcon />
                    </Button>
                  </>
                ),
              },
            }}
          />
        </>
      )}

      {modalState && (
        <Modal
          open={modalState}
          size="m"
          title="Beoordelaar wijzigen"
          onClose={() => setModalState(false)}
        >
          <Body>
            <Form
              autoComplete="off"
              justify="stretch"
              fields={[
                {
                  label: "Beoordelaar",
                  name: "reviewer",
                  type: "string",
                  options: reviewers.map((user) => ({
                    label: formatUser(user),
                    value: user.pk,
                  })),
                  required: true,
                },
                {
                  autoFocus: true,
                  label: "Reden",
                  name: "comment",
                  type: "text",
                  required: true,
                },
              ]}
              initialValues={{ reviewer: reviewer?.user?.pk }}
              validateOnChange={true}
              onSubmit={handleSubmit}
              labelSubmit={"Toewijzen"}
            />
          </Body>
        </Modal>
      )}
    </>
  );
}
