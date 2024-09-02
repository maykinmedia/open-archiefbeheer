import {
  AttributeData,
  Badge,
  Body,
  Button,
  CardBaseTemplate,
  Form,
  FormField,
  Modal,
  P,
  SerializedFormData,
  Solid,
  Toolbar,
  ToolbarItem,
  field2Title,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { useSubmitAction } from "../../../hooks";
import {
  canMarkAsReadyToReview,
  canMarkListAsFinal,
  canTriggerDestruction,
} from "../../../lib/auth/permissions";
import {
  PROCESSING_STATUS_ICON_MAPPING,
  PROCESSING_STATUS_LEVEL_MAPPING,
  PROCESSING_STATUS_MAPPING,
} from "../../constants";
import { UpdateDestructionListAction } from "./DestructionListDetail.action";
import { DestructionListDetailContext } from "./DestructionListDetail.loader";
import { DestructionListEdit } from "./components/DestructionListEdit/DestructionListEdit";
import { DestructionListProcessReview } from "./components/DestructionListProcessReview/DestructionListProcessReview";
import { DestructionListToolbar } from "./components/DestructionListToolbar/DestructionListToolbar";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { archivists, destructionList, review, user, destructionListItems } =
    useLoaderData() as DestructionListDetailContext;
  const submitAction = useSubmitAction<UpdateDestructionListAction>();

  const [archivistModalOpenState, setArchivistModalOpenState] = useState(false);
  const [readyToReviewModalOpenState, setReadyToReviewModalOpenState] =
    useState(false);
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
    {
      label: "Comment",
      name: "comment",
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
    if (canMarkAsReadyToReview(user, destructionList)) {
      return [
        {
          children: (
            <>
              <Solid.DocumentArrowUpIcon />
              Ter beoordeling indienen
            </>
          ),
          onClick: () => setReadyToReviewModalOpenState(true),
          pad: "h",
        },
      ];
    }
    if (canMarkListAsFinal(user, destructionList)) {
      return [
        {
          children: (
            <>
              <Solid.KeyIcon />
              Markeren als definitief
            </>
          ),
          onClick: () => setArchivistModalOpenState(true),
          pad: "h",
        },
      ];
    }
    if (canTriggerDestruction(user, destructionList)) {
      return [
        destructionList.processingStatus === "new" ? (
          <></>
        ) : (
          <Badge
            key={destructionList.pk}
            level={
              PROCESSING_STATUS_LEVEL_MAPPING[destructionList.processingStatus]
            }
          >
            {PROCESSING_STATUS_ICON_MAPPING[destructionList.processingStatus]}
            {field2Title(
              PROCESSING_STATUS_MAPPING[destructionList.processingStatus],
            )}
          </Badge>
        ),
        "spacer",
        ["new", "failed"].includes(destructionList.processingStatus) ? (
          {
            bold: true,
            children: (
              <>
                <Solid.TrashIcon />
                {destructionList.processingStatus === "new"
                  ? "Vernietigen starten"
                  : "Vernietigen herstarten"}
              </>
            ),
            variant: "danger",
            onClick: () => setDestroyModalOpenState(true),
            pad: "h",
          }
        ) : (
          <></>
        ),
      ];
    }
  };

  /**
   * Dispatches action to mark the destruction list as final (archivist approves).
   */
  const handleReadyToReview = async () => {
    submitAction({
      type: "READY_TO_REVIEW",
      payload: {
        uuid: destructionList.uuid,
      },
    });
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
        comment: data.comment as string,
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
   */
  const handleDestroy = async () => {
    submitAction({
      type: "DESTROY",
      payload: {
        uuid: destructionList.uuid,
      },
    });
  };

  return (
    <CardBaseTemplate secondaryNavigationItems={getSecondaryNavigationItems()}>
      <DestructionListToolbar />
      {review ? <DestructionListProcessReview /> : <DestructionListEdit />}

      {destructionList.status === "new" && (
        <Modal
          title="Ter beoordeling indienen"
          open={readyToReviewModalOpenState}
          size="m"
          onClose={() => setReadyToReviewModalOpenState(false)}
        >
          <Body>
            <P>
              U staat op het punt om de lijst ter beoordeling in te dienen,
              hierna kunt u geen zaken meer toevoegen en/of verwijderen van de
              vernietigingslijst.
            </P>
            <Toolbar align="end">
              <Button variant="primary" onClick={handleReadyToReview}>
                Ter beoordeling indienen
              </Button>
            </Toolbar>
          </Body>
        </Modal>
      )}

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
              U staat op het punt om {destructionListItems.count} zaken
              definitief te vernietigen.
            </P>
          </Body>
          <Body>
            <Form
              buttonProps={{
                variant: "danger",
              }}
              fields={destroyModalFormFields}
              labelSubmit={`${destructionListItems.count} zaken vernietigen`}
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
