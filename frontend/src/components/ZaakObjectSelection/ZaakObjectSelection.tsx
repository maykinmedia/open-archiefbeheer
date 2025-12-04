import { Form, Option } from "@maykin-ui/admin-ui";
import React, { FormEvent, useEffect, useMemo, useState } from "react";

import { useAlertOnError } from "../../hooks/useAlertOnError";
import { useDataFetcher } from "../../hooks/useDataFetcher";
import {
  ZaakObjectSelectionItemMutation,
  listZaakObjectSelection,
  updateZaakObjectSelection,
} from "../../lib/api/zaakObjectSelection";

/**
 * Props for `ZaakObjectSelection` component.
 */
export type ZaakObjectSelectionProps = {
  destructionListItemPk: number;
};

/**
 * Schema for `<Form/>` in `ZaakObjectSelection` component.
 */
export type ZaakObjectSelectionForm = { zaakobjecten: string[] };

/**
 * Allows selecting `ZaakObject` instances for destruction.
 */
export const ZaakObjectSelection: React.FC<ZaakObjectSelectionProps> = ({
  destructionListItemPk,
}) => {
  const { data: zaakObjectSelectionState, fetch } = useDataFetcher(
    (signal) => listZaakObjectSelection(destructionListItemPk, signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van gerelateerde objecten!",
      initialState: [],
    },
    [destructionListItemPk],
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

  const [mutationsState, setMutationsState] = useState<
    ZaakObjectSelectionItemMutation[]
  >([]);

  // Update (mutate) selection.
  useEffect(() => {
    // Bails if no mutations.
    if (!mutationsState.length) return;

    const updateController = new AbortController();
    let fetchController: AbortController;

    updateZaakObjectSelection(
      destructionListItemPk,
      mutationsState,
      updateController.signal,
    )
      .then(async () => {
        // Clear mutations.
        setMutationsState([]);

        // Update selection.
        fetchController = fetch();
      })
      .catch(alertOnMutateError);
    return () => {
      updateController.abort();
      fetchController?.abort();
    };
  }, [destructionListItemPk, mutationsState]);

  //
  // Interaction.
  //

  // Form fields definition based on zaakObjectSelectionState.
  const fields = useMemo(
    () => [
      {
        label: `Ondersteunde zaakobjecten (${selectedZaakObjectSelection.length}/${supportedZaakObjectSelection.length})`,
        name: "zaakobjecten",
        type: "checkbox",
        options: supportedZaakObjectSelection.map<Option>((item) => ({
          // @ts-expect-error - ZaakObject type seems to be broken.
          label: item.result.relatieomschrijving,
          value: item.url,
          defaultChecked: item.selected,
        })),
      },
      {
        label: `Niet-ondersteunde zaakobjecten (${unSupportedZaakObjectSelection.length})`,
        disabled: true,
        type: "checkbox",
        options: unSupportedZaakObjectSelection.map<Option>((item) => ({
          // @ts-expect-error - ZaakObject type seems to be broken.
          label: item.result.relatieomschrijving,
          value: item.url,
          defaultChecked: item.selected,
        })),
      },
    ],
    [supportedZaakObjectSelection, unSupportedZaakObjectSelection],
  );

  /**
   * Gets called when the form is submitted.
   * Updates the selection.
   */
  const handleSubmit = (
    _: FormEvent,
    { zaakobjecten }: ZaakObjectSelectionForm,
  ) => {
    const mutations =
      supportedZaakObjectSelection.map<ZaakObjectSelectionItemMutation>(
        ({ url }) => {
          return {
            url: url,
            selected: zaakobjecten.includes(url),
          };
        },
      );

    // Trigger update/mutate effect.
    setMutationsState(mutations);
  };

  return (
    <Form<ZaakObjectSelectionForm>
      fields={fields}
      labelSubmit={"Opslaan"}
      showRequiredExplanation={false}
      onSubmit={handleSubmit}
    />
  );
};
