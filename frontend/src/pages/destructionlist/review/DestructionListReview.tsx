import {
  AttributeData,
  AttributeTable,
  Body,
  Column,
  Form,
  FormField,
  Grid,
  H3,
  Hr,
  Modal,
  Outline,
  P,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import { useLoaderData, useRevalidator, useSubmit } from "react-router-dom";
import { useAsync } from "react-use";

import { formatDate } from "../../../lib/format/date";
import {
  addToZaakSelection,
  getZaakSelection,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { DestructionList as DestructionListComponent } from "../create/components";
import { DestructionListToolbar } from "../detail/components/DestructionListToolbar/DestructionListToolbar";
import "./DestructionListReview.css";
import { DestructionListReviewContext } from "./DestructionListReview.loader";

export const getDestructionListReviewKey = (id: string) =>
  `destruction-list-review-${id}`;

/**
 * The interface for the zaken modal state
 */
interface ZaakModalDataState {
  open: boolean;
  title?: string;
  uuid?: string;
}

/**
 * The interface for the list modal state
 */
interface ListModalDataState {
  listFeedback?: string;
  open: boolean;
}

/**
 * The interface for the form data of the zaken
 */
export interface FormDataState {
  motivation: string;
  uuid: string;
  url: string;
}

/**
 * Review-destruction-list page
 */
export function DestructionListReviewPage() {
  const {
    reviewItems,
    reviewResponse,
    zaken,
    selectedZaken,
    uuid,
    destructionList,
  } = useLoaderData() as DestructionListReviewContext;
  const submit = useSubmit();
  const revalidator = useRevalidator();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);

  /* Tooltip Motivation */
  const [tooltipMotivation, setTooltipMotivation] = useState<string>("");

  /* State to manage the count of selected zaken */
  const [zaakSelection, setZaakSelection] = useState<FormDataState[]>([]);

  /* State to manage the state of the zaak modal (when clicking a checkbox) */
  const [zaakModalDataState, setZaakModalDataState] =
    useState<ZaakModalDataState>({
      open: false,
    });

  /* State to handle the modal for the entire list (when clicking on the page action) */
  const [listModalDataState, setListModalDataState] =
    useState<ListModalDataState>({
      open: false,
    });

  /* On render of the page we will update the selection count */
  useAsync(async () => {
    await updateZaakSelectionCountState();
  }, []);

  const removeZaakFromSelection = async (zaak: Zaak) => {
    await removeFromZaakSelection(destructionListReviewKey, [zaak]);
    void updateZaakSelectionCountState();
    revalidator.revalidate();
  };

  const addZaakToSelection = async (zaak: Zaak, motivation: string) => {
    await addToZaakSelection<FormDataState>(destructionListReviewKey, [zaak], {
      motivation,
      uuid: zaak.uuid!,
      url: zaak.url as string,
    });
    void updateZaakSelectionCountState();
    revalidator.revalidate;
  };

  /* Triggered once you select (click a checkbox) a specific row in the list */
  const onSelect = async (row: AttributeData[], selected: boolean) => {
    const firstZaak = row[0] as unknown as Zaak;
    /* If we deselect, we remove it from the selection list and update the count */
    if (!selected) {
      await removeZaakFromSelection(firstZaak);
      return;
    }
    /* Otherwise, we open up a modal */
    setZaakModalDataState({
      // TODO: Control the check/uncheck of the checkbox? Is this even necessary if we move away from checkboxes later on? It's quite some work.
      open: true,
      uuid: firstZaak.uuid,
      title: `${firstZaak.identificatie} uitzonderen`,
    });
  };

  const onCloseModal = async () => {
    const zaak = zaken.results.find((z) => z.uuid === zaakModalDataState.uuid)!;
    const zaakInSelection = zaakSelection.some((z) => z?.uuid === zaak?.uuid);

    // We make this check so that if we click on the action icon, we don't accidentally remove the zaak from the selection if it was selected already
    if (!zaakInSelection) await removeZaakFromSelection(zaak);

    setZaakModalDataState({
      open: false,
    });
  };

  /* The fields for the zaken modal (when you click a checkbox) */
  const zaakModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Reden van uitzondering",
      placeholder: "Vul hier een reden voor uitzondering in",
      name: "motivation",
      type: "text",
      required: true,
    },
  ];

  /* The fields for the entire list (when you click the page action) */
  const listModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Opmerking",
      name: "list_feedback",
      placeholder: "Vul hier een opmerking(en) in",
      type: "text",
      required: true,
    },
  ];

  /**
   * Gets called whenever you submit the zaken form that's triggered by clicking a checkbox
   * @param _
   * @param data
   */
  const onSubmitZaakForm = async (_: FormEvent, data: AttributeData) => {
    const zaak = zaken.results.find((z) => z.uuid === zaakModalDataState.uuid)!;
    const motivation = data.motivation as string;
    await addZaakToSelection(zaak, motivation);
    setZaakModalDataState({
      open: false,
    });
  };

  /**
   * Gets called whenever you submit the list form that's triggered by clicking the page action
   * @param _
   * @param data
   */
  const onSubmitDestructionListForm = async (
    _: FormEvent,
    data: AttributeData,
  ) => {
    submit(
      {
        listFeedback: data.list_feedback as string,
      },
      { method: "POST", encType: "application/json" },
    );
  };

  /**
   * Updates the count of the selected zaken to the state
   */
  const updateZaakSelectionCountState = async () => {
    const zaakSelection = await getZaakSelection<FormDataState>(
      destructionListReviewKey,
    );
    const zaakSelectionSelected = Object.values(zaakSelection).filter(
      (f) => f.selected,
    );
    setZaakSelection(zaakSelectionSelected.map((f) => f.detail!));
  };

  const activeReviewItem = reviewItems?.find(
    (ri) => ri.zaak.uuid === zaakModalDataState.uuid,
  );
  const activeItemResponse =
    activeReviewItem &&
    reviewResponse?.itemsResponses.find(
      (ir) => ir.reviewItem === activeReviewItem.pk,
    );

  return (
    <>
      <Modal
        allowClose={true}
        open={zaakModalDataState.open}
        size="m"
        title={zaakModalDataState.title}
        onClose={onCloseModal}
      >
        <Body>
          {activeItemResponse && (
            <>
              <Grid>
                <Column span={3}>
                  <H3>
                    Antwoord (
                    {formatDate(new Date(String(activeItemResponse?.created)))})
                  </H3>
                </Column>

                <Column span={9}>
                  <P bold>Opmerkingen</P>
                  <P muted>{activeItemResponse.comment}</P>
                </Column>
              </Grid>

              <Hr />
            </>
          )}

          <Grid>
            <Column span={3}>
              <H3>Wijzigingen</H3>
            </Column>

            <Column span={9}>
              <Form
                fields={zaakModalFormFields}
                onSubmit={onSubmitZaakForm}
                validateOnChange={true}
                labelSubmit={"Uitzonderen"}
              />
            </Column>
          </Grid>
        </Body>
      </Modal>
      <Modal
        title={zaakSelection.length > 0 ? "Beoordelen" : "Accorderen"}
        open={listModalDataState.open}
        size="m"
        onClose={() => setListModalDataState({ open: false })}
      >
        <Body>
          <Form
            fields={listModalFormFields}
            onSubmit={onSubmitDestructionListForm}
            validateOnChange
            labelSubmit={zaakSelection.length > 0 ? "Beoordelen" : "Accorderen"}
          />
        </Body>
      </Modal>

      <DestructionListComponent
        storageKey={destructionListReviewKey}
        zaken={zaken}
        selectedZaken={selectedZaken}
        labelAction={zaakSelection.length > 0 ? "Beoordelen" : "Accorderen"}
        title="Zaakdossiers"
        onSubmitSelection={() => setListModalDataState({ open: true })}
        onSelect={onSelect}
        allowSelectAll={false}
        actions={[
          {
            children: <Outline.ChatBubbleBottomCenterIcon />,
            title: "Uitzonderen",
            tooltip: tooltipMotivation && (
              <AttributeTable
                object={{
                  // "Opmerking van auteur":
                  "Reden van uitzondering": tooltipMotivation,
                }}
                valign="start"
              />
            ),
            onInteract: (_, detail) => {
              const _detail = detail as FormDataState | undefined;
              if (_detail) {
                setTooltipMotivation(_detail.motivation);
              } else {
                setTooltipMotivation("");
              }
            },
            onClick: (zaak: Zaak) => {
              setZaakModalDataState({
                open: true,
                uuid: zaak.uuid,
                title: `${zaak.identificatie} uitzonderen`,
              });
            },
          },
        ]}
      >
        <DestructionListToolbar
          destructionList={destructionList}
          reviewResponse={reviewResponse}
        />
      </DestructionListComponent>
    </>
  );
}
