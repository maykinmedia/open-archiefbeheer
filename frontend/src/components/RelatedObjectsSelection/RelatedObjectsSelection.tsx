import { Form, Option } from "@maykin-ui/admin-ui";
import { forceArray } from "@maykin-ui/client-common";
import React, { FormEvent, useEffect, useMemo, useState } from "react";

import { useAlertOnError } from "../../hooks/useAlertOnError";
import { useDataFetcher } from "../../hooks/useDataFetcher";
import { User } from "../../lib/api/auth";
import { DestructionList } from "../../lib/api/destructionLists";
import { DestructionListItem } from "../../lib/api/destructionListsItem";
import {
  RelatedObjectsSelectionItem,
  RelatedObjectsSelectionItemMutation,
  listRelatedObjectsSelection,
  updateRelatedObjectsSelection,
} from "../../lib/api/relatedObjectsSelection";
import { canUpdateDestructionList } from "../../lib/auth/permissions";

/**
 * Props for `<RelatedObjectsSelection/>` component.
 */
export type ZaakObjectSelectionProps = {
  destructionList: DestructionList;
  destructionListItem: DestructionListItem;
  user: User;
  onChange?: (selectedRelatedObjectsCount: number) => void;
};

/**
 * Schema for `<Form/>` in `<RelatedObjectsSelection/>` component.
 */
export type RelatedObjectsSelectionForm = { zaakobjecten: string[] };

/**
 * Allows selecting related object instances for destruction.
 */
export const RelatedObjectsSelection: React.FC<ZaakObjectSelectionProps> = ({
  destructionList,
  destructionListItem,
  user,
  onChange,
}) => {
  const [mutationsState, setMutationsState] = useState<
    RelatedObjectsSelectionItemMutation[]
  >([]);

  const canUpdate = canUpdateDestructionList(user, destructionList);
  const { data: zaakObjectSelectionState, fetch } = useDataFetcher<
    RelatedObjectsSelectionItem[]
  >(
    (signal) => listRelatedObjectsSelection(destructionListItem.pk, signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van gerelateerde objecten!",
      initialState: [],
    },
    [destructionListItem.pk, mutationsState.length],
  );

  //
  // Selection state.
  //

  // Selection items supported through a plugin.
  const supportedZaakObjectSelection = useMemo(
    () => zaakObjectSelectionState.filter((item) => item.supported),
    [zaakObjectSelectionState],
  );

  // Selection items not supported through a plugin.
  const unSupportedZaakObjectSelection = useMemo(
    () => zaakObjectSelectionState.filter((item) => !item.supported),
    [zaakObjectSelectionState],
  );

  // Selection items with `selected: true`.
  const selectedZaakObjectSelection = useMemo(
    () => supportedZaakObjectSelection.filter((item) => item.selected),
    [zaakObjectSelectionState],
  );

  //
  // Mutation state.
  //

  const alertOnMutateError = useAlertOnError(
    "Er is een fout opgetreden bij het selecteren van gerelateerde objecten!",
  );

  // Update (mutate) selection.
  useEffect(() => {
    // Bails if no mutations.
    if (!mutationsState.length) return;

    const updateController = new AbortController();
    let fetchController: AbortController;

    updateRelatedObjectsSelection(
      destructionListItem.pk,
      mutationsState,
      updateController.signal,
    )
      .then(async () => {
        // Clear mutations.
        setMutationsState([]);
        onChange?.(mutationsState.filter((m) => m.selected).length);

        // Update selection.
        fetchController = fetch();
      })
      .catch(alertOnMutateError);
    return () => {
      updateController.abort();
      fetchController?.abort();
    };
  }, [destructionListItem.pk, mutationsState]);

  //
  // Interaction.
  //

  // Form fields definition based on zaakObjectSelectionState.
  const fields = useMemo(
    () => [
      {
        label: `Ondersteunde objecten (${selectedZaakObjectSelection.length}/${supportedZaakObjectSelection.length})`,
        disabled: !canUpdate, // Is use allowed to update?
        name: "zaakobjecten",
        type: "checkbox",
        options: supportedZaakObjectSelection.map<Option>((item) => ({
          label: String(
            item.result.relatieomschrijving ||
              item.result.objectTypeOverige ||
              item.result.objectType,
          ),
          value: item.url,
          defaultChecked: item.selected,
        })),
      },
      {
        label: `Niet-ondersteunde objecten (${unSupportedZaakObjectSelection.length})`,
        disabled: true,
        type: "checkbox",
        options: unSupportedZaakObjectSelection.map<Option>((item) => ({
          label: String(
            item.result.relatieomschrijving ||
              item.result.objectTypeOverige ||
              item.result.objectType,
          ),
          value: item.url,
          defaultChecked: item.selected,
        })),
      },
    ],
    [
      selectedZaakObjectSelection,
      supportedZaakObjectSelection,
      canUpdate,
      unSupportedZaakObjectSelection,
    ],
  );

  /**
   * Gets called when the form is submitted.
   * Updates the selection.
   */
  const handleSubmit = (
    _: FormEvent,
    { zaakobjecten }: RelatedObjectsSelectionForm,
  ) => {
    const mutations =
      supportedZaakObjectSelection.map<RelatedObjectsSelectionItemMutation>(
        ({ url }) => {
          return {
            url: url,
            selected: forceArray(zaakobjecten).includes(url),
          };
        },
      );

    // Trigger update/mutate effect.
    setMutationsState(mutations);
  };

  return (
    <Form<RelatedObjectsSelectionForm>
      fields={fields}
      labelSubmit={"Opslaan"}
      showActions={canUpdate}
      showRequiredExplanation={false}
      onSubmit={handleSubmit}
    />
  );
};
