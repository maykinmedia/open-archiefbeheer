import {
  AttributeTable,
  Body,
  Button,
  Form,
  Modal,
  SerializedFormData,
  Solid,
  useAlert,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useNavigation, useRevalidator } from "react-router-dom";

import { useReviewers, useSubmitAction } from "../../hooks";
import {
  DestructionList,
  reassignDestructionList,
} from "../../lib/api/destructionLists";
import { formatUser } from "../../lib/format/user";

export type DestructionListReviewerProps = {
  destructionList: DestructionList;
};

/**
 * Allows viewing/assigning the reviewers of a destruction list.
 * @param destructionList
 * @param reviewers
 */
export function DestructionListReviewer({
  destructionList,
}: DestructionListReviewerProps) {
  const [modalState, setModalState] = useState<boolean>(false);
  const { state } = useNavigation();
  const revalidator = useRevalidator();
  const alert = useAlert();
  const reviewers = useReviewers();

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
    reassignDestructionList(destructionList.uuid, {
      assignee: { user: Number(reviewer) },
      comment: String(comment),
    })
      .then(revalidator.revalidate) // Reload the current route.
      .catch(async (e) => {
        console.error(e);

        const promise = e instanceof Response && e.json();
        const data = await promise;

        alert(
          "Foutmelding",
          data.detail ||
            "Er is een fout opgetreden bij het bewerken van de beoordelaar!",
          "Ok",
        );
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
