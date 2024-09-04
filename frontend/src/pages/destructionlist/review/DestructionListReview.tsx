import {
  AttributeData,
  AttributeTable,
  Badge,
  BadgeProps,
  Body,
  Button,
  ButtonProps,
  Column,
  DataGridProps,
  Form,
  FormField,
  Grid,
  H3,
  Hr,
  ListTemplate,
  Modal,
  Outline,
  P,
  Solid,
  Toolbar,
} from "@maykin-ui/admin-ui";
import React, { FormEvent, useMemo, useState } from "react";
import { useLoaderData, useRevalidator, useSubmit } from "react-router-dom";
import { useAsync } from "react-use";

import { d } from "../../../../../../../.pyenv/versions/backend/lib/python3.11/site-packages/playwright/driver/package/lib/vite/traceViewer/assets/testServerConnection-CLJOcN3M";
import { useSubmitAction } from "../../../hooks";
import { formatDate } from "../../../lib/format/date";
import {
  addToZaakSelection,
  getZaakSelection,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { DestructionList as DestructionListComponent } from "../create/components";
import { UpdateDestructionListAction } from "../detail";
import { DestructionListToolbar } from "../detail/components/DestructionListToolbar/DestructionListToolbar";
import { DataGridAction, useDataGridProps } from "../hooks";
import { ReviewDestructionListAction } from "./DestructionListReview.action";
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
  const { reviewItems, reviewResponse, zaken, zaakSelection, uuid } =
    useLoaderData() as DestructionListReviewContext;

  const submitAction = useSubmitAction<ReviewDestructionListAction>();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);

  // The object list of the current page with review actions appended.
  const objectList = useMemo(() => {
    return zaken.results.map((zaak) => {
      const badge = getReviewBadgeForZaak(zaak);
      const actions = (
        <Toolbar
          pad={false}
          items={[
            {
              active: getApprovalStatusForZaak(zaak) === true,
              children: (
                <>
                  <Solid.HandThumbUpIcon />
                  Accorderen
                </>
              ),
              pad: "h",
              variant: "success",
              wrap: false,
              onClick: () => handleApproveClick(zaak),
            },
            {
              active: getApprovalStatusForZaak(zaak) === false,
              children: (
                <>
                  <Solid.HandThumbDownIcon />
                  Uitzonderen
                </>
              ),
              pad: "h",
              variant: "danger",
              wrap: false,
              onClick: () => handleExcludeClick(zaak),
            },
          ]}
        />
      );
      return { ...zaak, Beoordeling: badge, Acties: actions };
    });
  }, [zaken, zaakSelection]);

  // The paginated object list of the current page with review actions appended.
  const paginatedObjectList = Object.assign(
    { ...zaken },
    { results: objectList },
  );

  // DataGrid props.
  const { props: baseDataGridProps } = useDataGridProps(
    destructionListReviewKey,
    paginatedObjectList,
    zaakSelection,
  );
  const dataGridProps: DataGridProps = {
    ...baseDataGridProps,
    fields: [
      ...(baseDataGridProps.fields || []),
      { filterable: false, name: "Beoordeling", type: "text", width: "150px" },
      { filterable: false, name: "Acties", type: "text" },
    ],
    labelSelect: "Markeren als (on)gezien",
    labelSelectAll: "Alles als (on)gezien markeren", // FIXME: Broken
    onSelect: handleSelect,
  };

  /**
   * Returns a Badge indicating the review status of the `zaak`.
   * @param zaak
   */
  function getReviewBadgeForZaak(zaak: Zaak): React.ReactNode {
    const approved = getApprovalStatusForZaak(zaak);
    let icon: React.ReactNode = null;
    let label = "";
    let level: BadgeProps["level"];

    if (typeof approved === "boolean") {
      if (approved) {
        icon = <Solid.HandThumbUpIcon />;
        label = "Geaccordeerd";
        level = "success";
      } else {
        icon = <Solid.HandThumbDownIcon />;
        label = "Uitgezonderd";
        level = "danger";
      }
    } else {
      icon = <Solid.QuestionMarkCircleIcon />;
      label = "Niet beoordeeld";
      level = undefined;
    }
    return (
      // @ts-expect-error - style props not supported (yet?)
      <Badge level={level} style={{ display: "block" }}>
        {icon}
        {label}
      </Badge>
    );
  }

  /**
   * Returns whether a zaak is approved (`boolean`) or not reviewed (`null`).
   * @param zaak
   */
  function getApprovalStatusForZaak(zaak: Zaak): boolean | null {
    // @ts-expect-error - todo: type.
    const selection: {
      selected: boolean;
      detail?: { approved: boolean };
    } = zaakSelection[zaak.url as string] || undefined;
    if (!selection?.selected) {
      return null;
    }

    return typeof selection.detail?.approved === "boolean"
      ? selection.detail.approved
      : null;
  }

  /**
   * Gets called when a checkbox is clicked, this can either be a single row or
   * the "select all" checkbox.
   *
   * Select single zaak:
   *
   * - Checking selects and approves zaak.
   * - Unchecking unselects zaak.
   *
   * Select all:
   *
   * - Checking selects and approves all unselected zaken on page.
   * - Unchecking unselects all approved zaken on page.
   *
   *
   * @param rows
   * @param selected
   */
  function handleSelect(rows: AttributeData[], selected: boolean) {
    let zaken = rows;

    if (rows.length === 0) {
      zaken = objectList as AttributeData[];
    }

    /**
     * Returns batches of zaak urls to select (`shouldSelect=true`) or
     * unselect (`shouldSelect=false`).
     * @param shouldSelect
     */
    const filterZaken = (shouldSelect: boolean): string[] =>
      zaken
        .filter((zaak) => {
          const isSelectAll = rows.length === 0;
          const url = zaak.url as string;
          const record = zaakSelection[url];
          // @ts-expect-error - fixme
          const approved = record?.detail?.approved;

          // Get items to select.
          if (shouldSelect) {
            // Checking selects and approves zaak (or all zaken on page if select all is checked).
            return selected && approved !== false;
          }
          // Get items to unselect.
          else {
            if (isSelectAll) {
              // Unchecking unselects all approved zaken on page.
              return !selected && approved !== false;
            } else {
              // Unchecking unselects zaak.
              return !selected;
            }
          }
        })
        .map((z) => z.url as string);

    const zakenToApprove = filterZaken(true);
    const zakenToUnselect = filterZaken(false);

    submitAction({
      type: "APPROVE_ITEMS",
      payload: { destructionList: uuid, zaken: zakenToApprove },
    });

    submitAction({
      type: "UNSELECT_ITEMS",
      payload: { destructionList: uuid, zaken: zakenToUnselect },
    });
  }

  function handleApproveClick(zaak: Zaak) {
    submitAction({
      type: "APPROVE_ITEM",
      payload: { destructionList: uuid, zaak: zaak.url as string },
    });
  }

  function handleExcludeClick(zaak: Zaak) {
    submitAction({
      type: "EXCLUDE_ITEM",
      payload: { destructionList: uuid, zaak: zaak.url as string },
    });
  }

  // /* Tooltip Motivation */
  // const [tooltipMotivation, setTooltipMotivation] = useState<string>("");
  //
  // // // State to manage the count of selected zaken
  // // // TODO: Refactor this to avoid using a state but rely on the existing tooling.
  // // const [zaakSelection, setZaakSelection] = useState<FormDataState[]>([]);
  //
  // /* State to manage the state of the zaak modal (when clicking a checkbox) */
  // const [zaakModalDataState, setZaakModalDataState] =
  //   useState<ZaakModalDataState>({
  //     open: false,
  //   });
  //
  // /* State to handle the modal for the entire list (when clicking on the page action) */
  // const [listModalDataState, setListModalDataState] =
  //   useState<ListModalDataState>({
  //     open: false,
  //   });
  //
  // /* On render of the page we will update the selection count */
  // useAsync(async () => {
  //   await updateZaakSelectionCountState();
  // }, []);
  //
  // const removeZaakFromSelection = async (zaak: Zaak) => {
  //   await removeFromZaakSelection(destructionListReviewKey, [zaak]);
  //   void updateZaakSelectionCountState();
  //   revalidator.revalidate();
  // };
  //
  // const addZaakToSelection = async (zaak: Zaak, motivation: string) => {
  //   await addToZaakSelection<FormDataState>(destructionListReviewKey, [zaak], {
  //     motivation,
  //     uuid: zaak.uuid as string,
  //     url: zaak.url as string,
  //   });
  //   void updateZaakSelectionCountState();
  //   revalidator.revalidate;
  // };
  //
  // /**
  //  * Get called when you select (click a checkbox) a specific row in the list
  //  */
  // const handleSelect = async (row: AttributeData[], selected: boolean) => {
  //   const firstZaak = row[0] as unknown as Zaak;
  //   /* If we deselect, we remove it from the selection list and update the count */
  //   if (!selected) {
  //     await removeZaakFromSelection(firstZaak);
  //     return;
  //   }
  //   /* Otherwise, we open up a modal */
  //   setZaakModalDataState({
  //     // TODO: Control the check/uncheck of the checkbox? Is this even necessary if we move away from checkboxes later on? It's quite some work.
  //     open: true,
  //     uuid: firstZaak.uuid,
  //     title: `${firstZaak.identificatie} uitzonderen`,
  //   });
  // };

  /**
   //  * Get called when you close the zaak modal.
   //  */
  // const handleCloseZaakModal = async () => {
  //   const zaak = zaken.results.find(
  //     (z) => z.uuid === zaakModalDataState.uuid,
  //   ) as Zaak;
  //   // const zaakInSelection = zaakSelection.some((z) => z?.uuid === zaak?.uuid);
  //
  //   // We make this check so that if we click on the action icon, we don't accidentally remove the zaak from the selection if it was selected already
  //   // if (!zaakInSelection) await removeZaakFromSelection(zaak);
  //
  //   setZaakModalDataState({
  //     open: false,
  //   });
  // };

  // /**
  //  * Gets called whenever you submit the zaken form that's triggered by clicking a checkbox
  //  * @param _
  //  * @param data
  //  */
  // const handleSubmitZaakReview = async (_: FormEvent, data: AttributeData) => {
  //   const zaak = zaken.results.find(
  //     (z) => z.uuid === zaakModalDataState.uuid,
  //   ) as Zaak;
  //   const motivation = data.motivation as string;
  //   await addZaakToSelection(zaak, motivation);
  //   setZaakModalDataState({
  //     open: false,
  //   });
  //   revalidator.revalidate();
  // };

  // /**
  //  * Gets called whenever you submit the list form that's triggered by clicking the page action
  //  * @param _
  //  * @param data
  //  */
  // const handleSubmitListReview = async (_: FormEvent, data: AttributeData) => {
  //   submit(
  //     {
  //       listFeedback: data.list_feedback as string,
  //     },
  //     { method: "POST", encType: "application/json" },
  //   );
  // };

  // /* The fields for the zaken modal (when you click a checkbox) */
  // const zaakModalFormFields: FormField[] = [
  //   {
  //     autoComplete: "off",
  //     autoFocus: zaakModalDataState?.open,
  //     label: "Reden van uitzondering",
  //     placeholder: "Vul hier een reden voor uitzondering in",
  //     // value: zaakModalDataState?.uuid
  //     //   ? zaakSelection.find((z) => z.uuid === zaakModalDataState.uuid)
  //     //       ?.motivation
  //     //   : "",
  //     name: "motivation",
  //     type: "text",
  //     required: true,
  //   },
  // ];

  // /* The fields for the entire list (when you click the page action) */
  // const listModalFormFields: FormField[] = [
  //   {
  //     autoComplete: "off",
  //     autoFocus: zaakModalDataState?.open,
  //     label: "Opmerking",
  //     name: "list_feedback",
  //     placeholder: "Vul hier een opmerking(en) in",
  //     type: "text",
  //     required: true,
  //   },
  // ];

  // /**
  //  * Updates the count of the selected zaken to the state
  //  */
  // const updateZaakSelectionCountState = async () => {
  //   const zaakSelection = await getZaakSelection<FormDataState>(
  //     destructionListReviewKey,
  //   );
  //   const zaakSelectionSelected = Object.values(zaakSelection).filter(
  //     (f) => f.selected,
  //   );
  //   // setZaakSelection(
  //   //   zaakSelectionSelected.map((f) => f.detail as FormDataState),
  //   // );
  // };

  return (
    <ListTemplate dataGridProps={dataGridProps}>
      <DestructionListToolbar />
    </ListTemplate>
  );

  // return (
  //   <>
  //     {zaakModalDataState.open && (
  //       <Modal
  //         allowClose={true}
  //         open={zaakModalDataState.open}
  //         size="m"
  //         title={zaakModalDataState.title}
  //         onClose={handleCloseZaakModal}
  //       >
  //         <Body>
  //           {activeItemResponse && (
  //             <>
  //               <Grid>
  //                 <Column span={3}>
  //                   <H3>
  //                     Antwoord (
  //                     {formatDate(
  //                       new Date(String(activeItemResponse?.created)),
  //                     )}
  //                     )
  //                   </H3>
  //                 </Column>
  //
  //                 <Column span={9}>
  //                   <P bold>Opmerkingen</P>
  //                   <P muted>{activeItemResponse.comment}</P>
  //                 </Column>
  //               </Grid>
  //
  //               <Hr />
  //             </>
  //           )}
  //
  //           <Grid>
  //             <Column span={3}>
  //               <H3>Wijzigingen</H3>
  //             </Column>
  //
  //             <Column span={9}>
  //               <Form
  //                 fields={zaakModalFormFields}
  //                 onSubmit={handleSubmitZaakReview}
  //                 validateOnChange={true}
  //                 labelSubmit="Uitzonderen"
  //               />
  //             </Column>
  //           </Grid>
  //         </Body>
  //       </Modal>
  //     )}
  //     <Modal
  //       title={zaakSelection.length > 0 ? "Beoordelen" : "Accorderen"}
  //       open={listModalDataState.open}
  //       size="m"
  //       onClose={() => setListModalDataState({ open: false })}
  //     >
  //       <Body>
  //         <Form
  //           fields={listModalFormFields}
  //           onSubmit={handleSubmitListReview}
  //           validateOnChange
  //           labelSubmit={zaakSelection.length > 0 ? "Beoordelen" : "Accorderen"}
  //         />
  //       </Body>
  //     </Modal>
  //
  //     <DestructionListComponent
  //       storageKey={destructionListReviewKey}
  //       zaken={zaken}
  //       zaakSelection={selectedZaken.reduce(
  //         (selection, zaak) => ({
  //           ...selection,
  //           [zaak.url as string]: { selected: true },
  //         }),
  //         {},
  //       )}
  //       labelAction={
  //         zaakSelection.length > 0 ? (
  //           <>
  //             <Solid.HandThumbDownIcon />
  //             Beoordelen
  //           </>
  //         ) : (
  //           <>
  //             <Solid.HandThumbUpIcon />
  //             Accorderen
  //           </>
  //         )
  //       }
  //       title="Zaakdossiers"
  //       onSubmitSelection={() => setListModalDataState({ open: true })}
  //       onSelect={handleSelect}
  //       allowSelectAll={false}
  //       actions={actions}
  //       onClearSelection={() => setZaakSelection([])}
  //     >
  //       <DestructionListToolbar />
  //     </DestructionListComponent>
  //   </>
  // );
}
