import {
  Body,
  CardBaseTemplate,
  Form,
  FormField,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";

import { DestructionListToolbar } from "../../../components/DestructionListToolbar/DestructionListToolbar";
import { markDestructionListAsFinal } from "../../../lib/api/destructionLists";
import { canMarkListAsFinal } from "../../../lib/auth/permissions";
import { DestructionListEdit } from "./DestructionListEdit";
import { DestructionListProcessReview } from "./DestructionListProcessReview";
import { DestructionListDetailContext } from "./types";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { archivists, destructionList, review, reviewers, user } =
    useLoaderData() as DestructionListDetailContext;

  const [modalOpenState, setModalOpenState] = useState(false);
  const navigate = useNavigate();

  const modalFormFields: FormField[] = [
    {
      label: "Archivaris",
      name: "assigneeIds",
      options: archivists.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
  ];

  // TODO - Make a 404 page
  if (!destructionList) return <div>Deze vernietigingslijst bestaat niet.</div>;

  const onSubmit = async (_: FormEvent, data: SerializedFormData) => {
    await markDestructionListAsFinal(destructionList.uuid, {
      user: Number(data.assigneeIds),
    });
    setModalOpenState(false);
    return navigate("/");
  };

  return (
    <CardBaseTemplate
      secondaryNavigationItems={
        canMarkListAsFinal(user, destructionList)
          ? [
              {
                children: "Markeren als definitief",
                onClick: () => setModalOpenState(true),
                pad: "h",
              },
            ]
          : undefined
      }
    >
      <DestructionListToolbar
        destructionList={destructionList}
        review={review}
        reviewers={reviewers}
      />
      {review ? <DestructionListProcessReview /> : <DestructionListEdit />}
      <Modal
        title="Markeer als definitief"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            fields={modalFormFields}
            onSubmit={onSubmit}
            validateOnChange={true}
            role="form"
          />
        </Body>
      </Modal>
    </CardBaseTemplate>
  );
}
