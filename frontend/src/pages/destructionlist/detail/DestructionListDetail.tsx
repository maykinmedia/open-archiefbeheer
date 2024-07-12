import {
  Body,
  CardBaseTemplate,
  Form,
  FormField,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import { canMarkListAsFinal } from "../../../lib/auth/permissions";
import { UpdateDestructionListAction } from "./DestructionListDetail.action";
import { DestructionListDetailContext } from "./DestructionListDetail.loader";
import { DestructionListEdit } from "./components/DestructionListEdit/DestructionListEdit";
import { DestructionListProcessReview } from "./components/DestructionListProcessReview/DestructionListProcessReview";
import { DestructionListToolbar } from "./components/DestructionListToolbar/DestructionListToolbar";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { archivists, destructionList, review, reviewers, user } =
    useLoaderData() as DestructionListDetailContext;
  const submitAction = useSubmitAction<UpdateDestructionListAction>();

  const [modalOpenState, setModalOpenState] = useState(false);

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

  const handleSubmit = async (_: FormEvent, data: SerializedFormData) => {
    submitAction({
      type: "MAKE_FINAL",
      payload: {
        uuid: destructionList.uuid,
        user: Number(data.assigneeIds),
      },
    });
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
            onSubmit={handleSubmit}
            validateOnChange={true}
            role="form"
          />
        </Body>
      </Modal>
    </CardBaseTemplate>
  );
}
