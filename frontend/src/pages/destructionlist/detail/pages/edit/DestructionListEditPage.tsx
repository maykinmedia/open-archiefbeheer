import { Banner, ButtonProps, Solid, TypedField } from "@maykin-ui/admin-ui";
import { useMemo } from "react";
import {
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
} from "react-router-dom";

import { ProcessingStatusBadge } from "../../../../../components";
import { useSubmitAction } from "../../../../../hooks";
import { ProcessingStatus } from "../../../../../lib/api/processingStatus";
import { PaginatedZaken } from "../../../../../lib/api/zaken";
import { cacheDelete } from "../../../../../lib/cache/cache";
import { paginatedDestructionListItems2paginatedZaken } from "../../../../../lib/format/destructionList";
import { getFilteredZaakSelection } from "../../../../../lib/zaakSelection";
import { Zaak } from "../../../../../types";
import { BaseListView } from "../../../abstract";
import {
  DestructionListUpdateZakenActionPayload,
  UpdateDestructionListAction,
} from "../../DestructionListDetail.action";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { useSecondaryNavigation } from "../../hooks/useSecondaryNavigation";

type DestructionListEditData = Zaak & { processingStatus: string };

/**
 * Show items of a destruction list.
 * Allows viewing, adding and removing destruction list items.
 */
export function DestructionListEditPage() {
  const { destructionList, destructionListItems, selectableZaken, storageKey } =
    useRouteLoaderData(
      "destruction-list:detail",
    ) as DestructionListDetailContext;

  const { state } = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const submitAction = useSubmitAction<UpdateDestructionListAction>();
  const secondaryNavigationItems = useSecondaryNavigation();

  // Whether the edit mode is active.
  const isEditing = searchParams.get("is_editing")?.toLowerCase() === "true";

  // Whether the list is in edit mode.
  const editingState = useMemo(
    () =>
      destructionList.status === "new" &&
      Boolean(searchParams.get("is_editing")),
    [destructionList.status, searchParams],
  );

  // The initially select items.
  const initiallySelectedZakenOnPage = useMemo(
    () =>
      paginatedDestructionListItems2paginatedZaken(destructionListItems)
        .results,
    [destructionListItems],
  );

  // Whether extra fields should be rendered.
  const extraFields: TypedField<DestructionListEditData>[] = useMemo(
    () =>
      !editingState && destructionList.processingStatus !== "new"
        ? [
            {
              name: "processingStatus",
              type: "string",
              options: [
                { label: "New", value: "new" },
                { label: "Queued", value: "queued" },
                { label: "Processing", value: "processing" },
                { label: "Failed", value: "failed" },
                { label: "Succeeded", value: "succeeded" },
              ],
              width: "180px",
              valueTransform: (data) => (
                <ProcessingStatusBadge
                  processingStatus={data.processingStatus as ProcessingStatus}
                />
              ),
            },
          ]
        : [],
    [editingState, destructionList],
  );

  // DataGrid (paginated) results based on `editingState`.
  const paginatedZaken = useMemo<PaginatedZaken>(() => {
    if (editingState) {
      return selectableZaken;
    }
    return paginatedDestructionListItems2paginatedZaken(destructionListItems);
  }, [destructionListItems, selectableZaken, editingState]);

  // Selection actions based on `editingState`.
  const selectionActions: ButtonProps[] = useMemo(
    () =>
      editingState
        ? [
            {
              children: (
                <>
                  <Solid.PencilIcon />
                  Vernietigingslijst aanpassen
                </>
              ),
              disabled: ["loading", "submitting"].includes(state),
              variant: "primary",
              wrap: false,
              onClick: () => handleUpdate(),
            },
            {
              children: (
                <>
                  <Solid.NoSymbolIcon />
                  Annuleren
                </>
              ),
              disabled: false, // Set explicitly to prevent automatic value based on selection presence.
              wrap: false,
              onClick: () => handleSetEditing(false),
            },
          ]
        : destructionList.status === "new"
          ? [
              {
                children: (
                  <>
                    <Solid.PencilIcon />
                    Bewerken
                  </>
                ),
                wrap: false,
                onClick: () => handleSetEditing(true),
              },
            ]
          : [],
    [editingState, state],
  );

  /**
   * Gets called when the user clicks the edit button (user intents to adds/remove zaken to/from the destruction list
   * or escape such flow).
   * @param value
   */
  const handleSetEditing = async (value: boolean) => {
    await cacheDelete("list", true); // Remove possibly outdated cached value of list API's for choices.
    searchParams.set("page", "1");
    searchParams.set("is_editing", "true");
    setSearchParams(value ? searchParams : {});
  };

  /**
   * Gets called when the user updates the zaak selection (adds/remove zaken to/from the destruction list).
   */
  const handleUpdate = async () => {
    const zaakSelection = await getFilteredZaakSelection(
      storageKey,
      false,
      false,
    );
    const add = Object.entries(zaakSelection)
      .filter(([, { selected }]) => selected)
      .map(([url]) => url);
    const remove = Object.entries(zaakSelection)
      .filter(([, { selected }]) => !selected)
      .map(([url]) => url);

    const action: UpdateDestructionListAction<DestructionListUpdateZakenActionPayload> =
      {
        type: "UPDATE_ZAKEN",
        payload: {
          storageKey,
          add,
          remove,
        },
      };
    submitAction(action);
  };

  return (
    <>
      {destructionList.status === "deleted" &&
        destructionList.processingStatus === "failed" && (
          <Banner
            actionText="Opnieuw proberen"
            title="Er is een fout opgetreden tijdens het aanmaken van het vernietigingsrapport"
            withIcon
            variant="danger"
            onActionClick={() =>
              submitAction({
                type: "QUEUE_DESTRUCTION",
                payload: {
                  uuid: destructionList.uuid,
                },
              })
            }
          />
        )}
      <BaseListView<DestructionListEditData>
        destructionList={destructionList}
        extraFields={extraFields}
        restrictFilterChoices={isEditing ? false : "list"}
        initiallySelectedZakenOnPage={initiallySelectedZakenOnPage}
        paginatedZaken={paginatedZaken}
        secondaryNavigationItems={secondaryNavigationItems}
        selectable={editingState}
        selectionActions={selectionActions}
        storageKey={storageKey}
      ></BaseListView>
    </>
  );
}
