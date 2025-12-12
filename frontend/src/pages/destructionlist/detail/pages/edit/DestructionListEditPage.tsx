import {
  Banner,
  ButtonProps,
  Solid,
  ToolbarItem,
  TypedField,
} from "@maykin-ui/admin-ui";
import { useMemo } from "react";
import {
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
} from "react-router-dom";

import { ProcessingStatusBadge } from "../../../../../components";
import { useSubmitAction } from "../../../../../hooks";
import { PaginatedResults } from "../../../../../lib/api/paginatedResults";
import { ProcessingStatus } from "../../../../../lib/api/processingStatus";
import { cacheDelete } from "../../../../../lib/cache/cache";
import {
  DestructionDetailData,
  paginatedDestructionListItems2paginatedDetail,
} from "../../../../../lib/format/destructionList";
import { getFilteredZaakSelection } from "../../../../../lib/zaakSelection";
import { BaseListView } from "../../../abstract";
import {
  DestructionListUpdateZakenActionPayload,
  UpdateDestructionListAction,
} from "../../DestructionListDetail.action";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";
import { useSecondaryNavigation } from "../../hooks";

/**
 * Show items of a destruction list.
 * Allows viewing, adding and removing destruction list items.
 */
function DestructionListEditPage() {
  const {
    destructionList,
    destructionListItems,
    selectableZaken,
    storageKey: loaderStorageKey,
  } = useRouteLoaderData(
    "destruction-list:detail",
  ) as DestructionListDetailContext;

  const { state } = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const submitAction = useSubmitAction<UpdateDestructionListAction>();
  const secondaryNavigation =
    useSecondaryNavigation<DestructionListDetailContext>();

  // Whether the edit mode is active.
  const isEditing =
    destructionList.status === "new" &&
    searchParams.get("is_editing")?.toLowerCase() === "true";

  // The initially select items.
  const initiallySelectedZakenOnPage = useMemo(
    () =>
      paginatedDestructionListItems2paginatedDetail(destructionListItems)
        .results,
    [destructionListItems],
  );

  // Selection actions based on `editingState`.
  const selectionActions: ButtonProps[] = useMemo(
    () =>
      isEditing
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
    [isEditing, state],
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
      getStorageKey(),
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
          storageKey: getStorageKey(),
          add,
          remove,
        },
      };
    submitAction(action);
  };

  //
  // Common.
  //

  /**
   * Generates a list of extra fields for rendering or processing, based on specific conditions.
   */
  function getExtraFields(): TypedField<DestructionDetailData>[] {
    return !isEditing && destructionList.processingStatus !== "new"
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
      : [];
  }

  /**
   * Retrieves a paginated list of objects.
   */
  function getPaginatedObjectList(): PaginatedResults<DestructionDetailData> {
    return isEditing
      ? selectableZaken
      : paginatedDestructionListItems2paginatedDetail(destructionListItems);
  }

  /**
   * Retrieves the secondary navigation items.
   */
  function getSecondaryNavigationItems(): ToolbarItem[] {
    return secondaryNavigation;
  }

  /**
   * A memoized callback function that retrieves the storage key.
   */
  function getStorageKey(): string {
    return loaderStorageKey;
  }

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
      <BaseListView<DestructionDetailData>
        // Common
        destructionList={destructionList}
        extraFields={getExtraFields()}
        paginatedObjectList={getPaginatedObjectList()}
        secondaryNavigationItems={getSecondaryNavigationItems()}
        storageKey={getStorageKey()}
        // Specific
        initiallySelectedZakenOnPage={initiallySelectedZakenOnPage}
        restrictFilterChoices={isEditing ? false : "list"}
        selectable={isEditing}
        selectionActions={selectionActions}
      ></BaseListView>
    </>
  );
}

export default DestructionListEditPage;
