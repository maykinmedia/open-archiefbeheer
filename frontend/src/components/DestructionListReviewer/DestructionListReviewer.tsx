import {
  AttributeTable,
  Button,
  FormField,
  P,
  SerializedFormData,
  Solid,
  useAlert,
  useFormDialog,
  validateForm,
} from "@maykin-ui/admin-ui";
import { useEffect, useMemo, useState } from "react";
import { useNavigation, useRevalidator } from "react-router-dom";

import {
  useCoReviewers,
  useCoReviews,
  useDestructionListCoReviewers,
  useReviewers,
  useWhoAmI,
} from "../../hooks";
import {
  DestructionList,
  reassignDestructionList,
  updateCoReviewers,
} from "../../lib/api/destructionLists";
import {
  canReassignDestructionList,
  canReviewDestructionList,
} from "../../lib/auth/permissions";
import { collectErrors } from "../../lib/format/error";
import { formatUser } from "../../lib/format/user";

export type DestructionListReviewerProps = {
  destructionList: DestructionList;
};

export type DestructionListReviewerFormType = {
  comment: string;
  reviewer?: string;
  coReviewer?: string[];
};

/**
 * Allows viewing/assigning the reviewers of a destruction list.
 * @param destructionList
 * @param reviewers
 */
export function DestructionListReviewer({
  destructionList,
}: DestructionListReviewerProps) {
  const { state } = useNavigation();
  const revalidator = useRevalidator();
  const alert = useAlert();
  const formDialog = useFormDialog<DestructionListReviewerFormType>();
  const coReviews = useCoReviews(destructionList);
  const reviewers = useReviewers();
  const coReviewers = useCoReviewers();
  const assignedCoReviewers = useDestructionListCoReviewers(destructionList);
  const user = useWhoAmI();

  const [
    assignCoReviewersFormValuesState,
    setAssignCoReviewersFormValuesState,
  ] = useState<SerializedFormData>({});

  /**
   * Pre-populates `assignCoReviewersFormValuesState` with the current
   * co-reviewers.
   */
  useEffect(() => {
    const coReviewerPks = assignedCoReviewers.map((r) => r.user.pk.toString());

    setAssignCoReviewersFormValuesState({
      ...assignCoReviewersFormValuesState,
      coReviewer: coReviewerPks,
    });
  }, [assignedCoReviewers.map((r) => r.user.pk).join()]);

  const [assignCoReviewerModalOpenState, setAssignCoReviewerModalOpenState] =
    useState(false);

  /**
   * Updates `assignCoReviewersFormValuesState` with `values`.
   * This allows `field` to use filtered options based on it's value.
   * @param values
   */
  const handleValidate = (values: SerializedFormData) => {
    // Ignore first run.
    if (!Object.keys(values).length) {
      return;
    }
    setAssignCoReviewersFormValuesState(values);
    return validateForm(values, fields);
  };

  /**
   * Gets called when the change is confirmed.
   */
  const handleSubmit = (data: DestructionListReviewerFormType) => {
    const { coReviewer, reviewer, comment } = data;
    setAssignCoReviewerModalOpenState(false);

    const promises: Promise<unknown>[] = [];

    if (coReviewer) {
      const add = coReviewer
        .filter((pk) => Boolean(pk))
        .map((pk) => ({ user: Number(pk) }));

      const promise = updateCoReviewers(destructionList.uuid, {
        add,
        comment: comment as string,
      }).catch(async (e) => {
        console.error(e);
        try {
          const data = await e.json();
          const errors = collectErrors(data).join("\n");
          alert("Foutmelding", data.detail || errors, "Ok");
        } catch {
          alert(
            "Foutmelding",
            "Er is een fout opgetreden bij het bewerken van de mede beoordelaars!",
            "Ok",
          );
          return;
        }
      });

      promises.push(promise);
    }

    if (reviewer) {
      const promise = reassignDestructionList(destructionList.uuid, {
        assignee: { user: Number(reviewer) },
        comment: String(comment),
      }).catch(async (e) => {
        console.error(e);
        try {
          const data = await e.json();
          const errors = collectErrors(data).join("\n");
          alert("Foutmelding", data.detail || errors, "Ok");
        } catch {
          alert(
            "Foutmelding",
            "Er is een fout opgetreden bij het bewerken van de beoordelaar!",
            "Ok",
          );
          return;
        }
      });

      promises.push(promise);
    }

    Promise.all(promises).then(() => revalidator.revalidate());
  };

  const reviewer = destructionList.assignees.find(
    (assignee) => assignee.role === "main_reviewer",
  );

  /**
   * The fields to show in the form dialog, can be either for (re)assigning a
   * reviewer or for (re)assigning co-reviewers.
   */
  const fields = useMemo<FormField[]>(() => {
    if (!user) return [];

    const reviewer = {
      label: "Beoordelaar",
      name: "reviewer",
      type: "string",
      options: reviewers.map((user) => ({
        label: formatUser(user),
        value: user.pk,
      })),
      required: true,
      value: reviewers.find((r) => r.pk === user.pk)?.pk,
    };

    const comment = {
      autoFocus: true,
      label: "Reden",
      name: "comment",
      type: "text",
      required: true,
    };

    const activeCoReviewers =
      (assignCoReviewersFormValuesState.coReviewer as string[]) || [];

    if (canReviewDestructionList(user, destructionList)) {
      const coReviewerFields = new Array(5).fill(null).map((f, i) => {
        return {
          ...f,
          label: `Medebeoordelaar ${1 + i}`,
          name: "coReviewer",
          required: false,
          type: "string",
          value: activeCoReviewers?.[i],
          options: coReviewers
            // Don't show the co-reviewer as option if:
            // - The co-reviewer is already selected AND
            // - The co-reviewer is not selected as value for the current
            //   field.
            .filter((c) => {
              const selectedIndex = activeCoReviewers.indexOf(c.pk.toString());
              if (selectedIndex < 0 || selectedIndex === i) {
                return true;
              }
              return false;
            })
            .map((user) => ({
              label: formatUser(user),
              value: user.pk,
            })),
        };
      });

      return [...coReviewerFields, comment];
    }
    return [reviewer, comment];
  }, [
    user,
    destructionList,
    reviewers,
    assignedCoReviewers,
    assignCoReviewersFormValuesState,
  ]);

  /**
   * Contains the co-reviewers that are assigned to the destruction list as
   * items for the AttributeTable.
   */
  const coReviewerItems = useMemo(
    () =>
      assignedCoReviewers.reduce((acc, coReviewer, i) => {
        const key = `Medebeoordelaar ${1 + i}`;
        const hasReview = coReviews.find(
          (coReview) => coReview.author?.pk === coReviewer.user.pk,
        );
        const icon = hasReview && <Solid.CheckCircleIcon />;

        return {
          ...acc,
          [key]: {
            label: key,
            value: (
              <P title={hasReview && "Medebeoordelaar is klaar met beoordelen"}>
                {formatUser(coReviewer.user)}
                &nbsp;
                {icon}
              </P>
            ),
          },
        };
      }, {}),
    [assignedCoReviewers, coReviews],
  );

  /**
   * Opens a dialog to assign a co-reviewer and updates it when `fields` change.
   */
  useEffect(() => {
    formDialog(
      "Beoordelaar toewijzen",
      null,
      fields,
      "Toewijzen",
      "Annuleren",
      handleSubmit,
      undefined,
      {
        allowClose: true,
        open: assignCoReviewerModalOpenState,
        onClose: () => setAssignCoReviewerModalOpenState(false),
      },
      {
        validate: handleValidate,
      },
    );
  }, [assignCoReviewerModalOpenState, JSON.stringify(fields)]);

  return (
    <>
      {reviewer && (
        <>
          <AttributeTable
            compact
            labeledObject={{
              reviewer: {
                label: "Beoordelaar",
                value: (
                  <P>
                    {formatUser(reviewer.user)}
                    {user &&
                      canReassignDestructionList(user, destructionList) && (
                        <>
                          &nbsp;
                          <Button
                            aria-label="Beoordelaar bewerken"
                            disabled={
                              state === "loading" || state === "submitting"
                            }
                            size="xs"
                            variant="secondary"
                            onClick={() =>
                              setAssignCoReviewerModalOpenState(true)
                            }
                          >
                            <Solid.PencilIcon />
                          </Button>
                        </>
                      )}
                  </P>
                ),
              },
              ...coReviewerItems,
            }}
          />
        </>
      )}
    </>
  );
}
