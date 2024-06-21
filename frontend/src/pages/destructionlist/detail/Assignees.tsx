import {
  AttributeTable,
  SerializedFormData,
  TypedField,
} from "@maykin-ui/admin-ui";
import React, { FormEvent } from "react";
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

  const handleSubmit = (_: FormEvent, data: SerializedFormData) => {
    const selectedAssignees: DestructionListAssignee[] = Object.values(
      data,
    ).map((username, i) => {
      const assignee = assignees.find(
        (assignee) => assignee.user.username === username,
      ) as DestructionListAssignee;
      return { ...assignee, order: i + 1 };
    });

    const assigneeIds = selectedAssignees.map((a) => a.user.pk);
    const formData = new FormData();
    assigneeIds.forEach((id) => formData.append("assigneeIds", id.toString()));
    submit(formData, { method: "PATCH" });
  };

  const fields = [
    {
      name: `reviewer_1`,
      type: "string",
      options: reviewers.map((user) => ({
        label: formatUser(user),
      })),
    },
    {
      name: `reviewer_2`,
      type: "string",
      options: reviewers.map((user) => ({
        label: formatUser(user),
      })),
    },
  ];

  const labeledObject = {
    reviewer_1: {
      label: "Reviewer 1",
      value: formatUser(assignees[1].user),
    },
    reviewer_2: {
      label: "Reviewer 2",
      value: formatUser(assignees[2].user),
    },
  };

  return (
    <AttributeTable
      editable={true}
      fields={fields}
      labeledObject={labeledObject}
      formProps={{
        nonFieldErrors: errors
          ? Object.values(errors).length
            ? Object.values(errors)
            : undefined
          : undefined,
        onSubmit: handleSubmit,
      }}
    />
  );
}
