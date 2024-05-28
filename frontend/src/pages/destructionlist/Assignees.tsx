import {
  AttributeTable,
  Body,
  Button, // Errors,
  Form,
  FormField,
  ObjectData,
  Outline,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useState } from "react";
import { useActionData, useSubmit } from "react-router-dom";
import { useAsync } from "react-use";

import { listReviewers } from "../../lib/api/reviewers";
import { AssigneesEditableProps, AssigneesFormProps } from "./types";

export function AssigneesForm({
  initialAssignees,
  onClose,
}: AssigneesFormProps) {
  const errors = useActionData() || {};
  const submit = useSubmit();

  const { loading, value: availableReviewers = [] } = useAsync(async () => {
    return await listReviewers();
  }, []);

  if (loading) return <Body>Loading...</Body>;

  const formFields: FormField[] = [
    {
      label: "Eerste reviewer",
      name: "assigneeIds",
      options: availableReviewers.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
    {
      label: "Tweede reviewer",
      name: "assigneeIds",
      options: availableReviewers.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
    },
  ];

  return (
    <Body className="destruction-list-detail destruction-list-detail__reviewers-form">
      {/*<Errors errors={Object.values(errors)} />*/}
      <Form
        fields={formFields}
        initialValues={{
          assigneeIds: initialAssignees.map((assignee) => assignee.user.pk),
        }}
        onSubmit={(event: FormEvent, data: SerializedFormData) => {
          const formData = new FormData();
          (data.assigneeIds as string[]).forEach((id) =>
            formData.append("assigneeIds", String(id)),
          );
          submit(formData, { method: "PATCH" });
          onClose();
        }}
      ></Form>
      <Button variant="outline" onClick={onClose}>
        Annuleren
      </Button>
    </Body>
  );
}

export function AssigneesEditable({ assignees }: AssigneesEditableProps) {
  const [isEditing, setIsEditing] = useState(false);

  const assigneesData: ObjectData = {};
  assignees.map((assignee) => {
    assigneesData[assignee.user.username] = {
      label:
        assignee.user.firstName && assignee.user.lastName
          ? `${assignee.user.firstName} ${assignee.user.lastName}`
          : assignee.user.username,
      value: "(heeft nog geen review gegeven)", // Todo: will come from backend
    };
  });

  const assigneesDisplay = <AttributeTable object={assigneesData} />;

  const assigneesForm = (
    <AssigneesForm
      initialAssignees={assignees}
      onClose={() => {
        setIsEditing(false);
      }}
    />
  );

  const label = (
    <div className="reviewers-label">
      Reviewers
      <Button
        size="xs"
        variant="secondary"
        onClick={() => {
          setIsEditing(true);
        }}
      >
        <Outline.PencilIcon />
      </Button>
    </div>
  );

  return (
    <AttributeTable
      object={{
        assignees: {
          label: label,
          value: isEditing ? assigneesForm : assigneesDisplay,
        },
      }}
    />
  );
}
