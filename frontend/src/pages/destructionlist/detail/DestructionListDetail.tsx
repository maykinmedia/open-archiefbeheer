import {
  AttributeData,
  Body,
  CardBaseTemplate,
  Form,
  FormField,
  Modal,
  P,
  SerializedFormData,
  ToolbarItem,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useLoaderData, useRevalidator } from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import { usePoll } from "../../../hooks/usePoll";
import {
  canMarkListAsFinal,
  canTriggerDestruction,
} from "../../../lib/auth/permissions";
import { UpdateDestructionListAction } from "./DestructionListDetail.action";
import { DestructionListDetailContext } from "./DestructionListDetail.loader";
import { DestructionListEdit } from "./components/DestructionListEdit/DestructionListEdit";
import { DestructionListProcessReview } from "./components/DestructionListProcessReview/DestructionListProcessReview";
import { DestructionListToolbar } from "./components/DestructionListToolbar/DestructionListToolbar";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { archivists, destructionList, review, reviewers, user, zaken } =
    useLoaderData() as DestructionListDetailContext;
  const submitAction = useSubmitAction<UpdateDestructionListAction>();

  const [archivistModalOpenState, setArchivistModalOpenState] = useState(false);
  const [destroyModalOpenState, setDestroyModalOpenState] = useState(false);

  // TODO - Make a 404 page (or remove?)
  if (!destructionList) return <div>Deze vernietigingslijst bestaat niet.</div>;

  // The approval form for the archivist.
  const archivistModalFormFields: FormField[] = [
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

  // The destroy form for the record manager.
  const destroyModalFormFields: FormField[] = [
    {
      autoFocus: destroyModalOpenState,
      label: "Type naam van de lijst ter bevestiging",
      name: "name",
      placeholder: "Naam van de vernietigingslijst",
      required: true,
    },
  ];

  /**
   * Returns the items to show in the secondary navigation (top bar).
   */
  const getSecondaryNavigationItems = (): ToolbarItem[] | undefined => {
    if (canMarkListAsFinal(user, destructionList)) {
      return [
        {
          children: "Markeren als definitief",
          onClick: () => setArchivistModalOpenState(true),
          pad: "h",
        },
      ];
    }
    if (canTriggerDestruction(user, destructionList)) {
      return [
        {
          bold: true,
          children: "Zaken op lijst definitief vernietigen",
          variant: "danger",
          onClick: () => setDestroyModalOpenState(true),
          pad: "h",
        },
      ];
    }
  };

  /**
   * Dispatches action to mark the destruction list as final (archivist approves).
   * @param _
   * @param data
   */
  const handleMakeFinal = async (_: FormEvent, data: SerializedFormData) => {
    submitAction({
      type: "MAKE_FINAL",
      payload: {
        uuid: destructionList.uuid,
        user: Number(data.assigneeIds),
      },
    });
  };

  const validateDestroy = ({ name }: AttributeData) => {
    if (name === destructionList.name) {
      return;
    }
    return {
      name: "De opgegeven naam komt niet overeen met de naam van de lijst! Controleer de naam van de lijst en probeer het opnieuw.",
    };
  };

  /**
   * Dispatches action to DESTROY ALL ZAKEN ON THE DESTRUCTION LIST!
   * @param _
   * @param data
   */
  const handleDestroy = async (_: FormEvent, data: SerializedFormData) => {
    submitAction({
      type: "DESTROY",
      payload: {
        uuid: destructionList.uuid,
      },
    });
  };

  return (
    <CardBaseTemplate secondaryNavigationItems={getSecondaryNavigationItems()}>
      <DestructionListToolbar
        destructionList={destructionList}
        review={review}
        reviewers={reviewers}
      />
      {review ? <DestructionListProcessReview /> : <DestructionListEdit />}

      {destructionList.status === "internally_reviewed" && (
        <Modal
          title="Markeer als definitief"
          open={archivistModalOpenState}
          size="m"
          onClose={() => setArchivistModalOpenState(false)}
        >
          <Body>
            <Form
              fields={archivistModalFormFields}
              labelSubmit="Markeer als definitief"
              role="form"
              validateOnChange={true}
              onSubmit={handleMakeFinal}
            />
          </Body>
        </Modal>
      )}

      {destructionList.status === "ready_to_delete" && (
        <Modal
          title="Zaken definitief vernietigen"
          open={destroyModalOpenState}
          size="m"
          onClose={() => setDestroyModalOpenState(false)}
        >
          <Body>
            <P>
              U staat op het punt om {zaken.count} zaken definitief te
              vernietigen.
            </P>
          </Body>
          <Body>
            <Form
              buttonProps={{
                variant: "danger",
              }}
              fields={destroyModalFormFields}
              labelSubmit={`${zaken.count} zaken vernietigen`}
              validate={validateDestroy}
              validateOnChange={true}
              role="form"
              onSubmit={handleDestroy}
            />
          </Body>
        </Modal>
      )}
    </CardBaseTemplate>
  );
}
