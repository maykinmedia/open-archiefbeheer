import {
  AttributeTable,
  Button,
  FormField,
  P,
  Solid,
  TypedSerializedFormData,
  useAlert,
  useFormDialog,
  validateForm,
} from "@maykin-ui/admin-ui";
import { useEffect, useMemo, useState } from "react";
import { useNavigation, useRevalidator } from "react-router-dom";

import { usePoll } from "../../hooks";
import { useDataFetcher } from "../../hooks/useDataFetcher";
import { User, whoAmI } from "../../lib/api/auth";
import { listCoReviews } from "../../lib/api/coReview";
import {
  DestructionList,
  listDestructionListCoReviewers,
  reassignDestructionList,
  updateCoReviewers,
} from "../../lib/api/destructionLists";
import { listCoReviewers, listReviewers } from "../../lib/api/reviewers";
import {
  canReassignDestructionList,
  canStartDestructionList,
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

  // Poll logic for co reviewers.
  const [coReviewersState, setCoReviewersState] = useState<User[]>([]);
  usePoll(
    async (signal) => {
      try {
        const coReviewers = await listCoReviewers(signal, false);
        const currentKey = coReviewersState.map((c) => c.pk).join();
        const newKey = coReviewers.map((c) => c.pk).join();
        const changed = currentKey !== newKey;

        if (changed) {
          setCoReviewersState(coReviewers);
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        throw e;
      }
    },
    [],
    {
      timeout: 10000,
    },
  );

  const { data: coReviews } = useDataFetcher(
    (signal) =>
      listCoReviews({ destructionList__uuid: destructionList?.uuid }, signal),
    {
      initialState: [],
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de mede beoordelingen!",
    },
    [],
  );

  const { data: reviewers } = useDataFetcher(
    listReviewers,
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van beoordelaars!",
      initialState: [],
    },
    [],
  );

  const { data: assignedCoReviewers } = useDataFetcher(
    () => listDestructionListCoReviewers(destructionList.uuid),
    {
      transform: (r) => r.filter((r) => r.role === "co_reviewer"), // Only list co-reviewers.
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de mede beoordelaars!",
      initialState: [],
    },
    [destructionList.uuid],
  );
  const { data: user } = useDataFetcher(
    (signal) => whoAmI(signal),
    {
      errorMessage:
        "Er is een fout opgetreden bij het ophalen van de huidige gebruiker!",
      initialState: null,
    },
    [],
  );

  const assignedMainReviewer = destructionList.assignees.find(
    (assignee) => assignee.role === "main_reviewer",
  );

  const [assignReviewersFormState, setAssignReviewersFormState] = useState<{
    reviewer: string;
    coReviewer: string[];
    comment: string;
  }>({ reviewer: "", coReviewer: [], comment: "" });

  /**
   * Pre-populates `assignCoReviewersFormValuesState` with the current
   * co-reviewers.
   */
  useEffect(() => {
    const coReviewerPks = assignedCoReviewers.map((r) => r.user.pk.toString());

    setAssignReviewersFormState({
      ...assignReviewersFormState,
      coReviewer: coReviewerPks,
      reviewer: assignedMainReviewer?.user.pk.toString() || "",
    });
  }, [assignedCoReviewers.map((r) => r.user.pk).join()]);

  const [assignCoReviewerModalOpenState, setAssignCoReviewerModalOpenState] =
    useState(false);

  /**
   * Updates `assignCoReviewersFormValuesState` with `values`.
   * This allows `field` to use filtered options based on it's value.
   * @param values
   */
  const handleValidate = (values: TypedSerializedFormData) => {
    const _values = Object.assign({ ...assignReviewersFormState }, values);
    if (Object.keys(_values).length) {
      setAssignReviewersFormState(_values as typeof assignReviewersFormState);
    }
    return validateForm(_values, fields);
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

  /**
   * The fields to show in the form dialog, can be either for (re)assigning a
   * reviewer or for (re)assigning co-reviewers.
   */
  const fields = useMemo<FormField[]>(() => {
    const reviewerField = {
      label: "Beoordelaar",
      name: "reviewer",
      type: "string",
      options: reviewers.map((u) => ({
        label: formatUser(u),
        value: u.pk,
      })),
      required: true,
      value: assignReviewersFormState.reviewer,
    };

    const commentField = {
      autoFocus: true,
      label: "Reden",
      name: "comment",
      type: "text",
      required: true,
      value: assignReviewersFormState.comment,
    };

    const activeCoReviewerFields =
      (assignReviewersFormState.coReviewer as string[]) || [];

    const coReviewerFields = new Array(5).fill(null).map((f, i) => {
      return {
        ...f,
        label: `Medebeoordelaar ${1 + i}`,
        name: "coReviewer",
        required: false,
        type: "string",
        value: assignReviewersFormState.coReviewer?.[i],
        options: coReviewersState
          // Don't show the co-reviewer as option if:
          // - The co-reviewer is already selected AND
          // - The co-reviewer is not selected as value for the current
          //   field.
          // - OR if the co-reviewer is equal to the author of the destruction list
          .filter((c) => {
            const selectedIndex = activeCoReviewerFields.indexOf(
              c.pk.toString(),
            );
            if (
              (selectedIndex < 0 || selectedIndex === i) &&
              c.pk !== destructionList.author.pk
            ) {
              return true;
            }
            return false;
          })
          .map((u) => ({
            label: formatUser(u),
            value: u.pk,
          })),
      };
    });

    if (!user || !canStartDestructionList(user)) {
      return [...coReviewerFields, commentField];
    }
    return [reviewerField, ...coReviewerFields, commentField];
  }, [
    user,
    destructionList,
    reviewers,
    coReviewersState,
    assignedCoReviewers,
    assignReviewersFormState,
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
      () => setAssignCoReviewerModalOpenState(false),
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
      {assignedMainReviewer && (
        <>
          <AttributeTable
            compact
            labeledObject={{
              reviewer: {
                label: "Beoordelaar",
                value: (
                  <P>
                    {formatUser(assignedMainReviewer.user)}
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
