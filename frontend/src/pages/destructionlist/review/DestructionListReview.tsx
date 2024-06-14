import {
  AttributeData,
  Body,
  Form,
  FormField,
  Modal,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useSubmit,
} from "react-router-dom";

import { DestructionList } from "../../../components";
import {
  CreateDestructionListReviewData,
  createDestructionListReview,
} from "../../../lib/api/destruction-list-reviews";
import { User, listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  ZaakSelection,
  addToZaakSelection,
  getZaakSelection,
  isZaakSelected,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import "./DestructionListReview.css";

const getDestructionListReviewKey = (id: string) =>
  `destruction-list-review-${id}`;

interface ZaakModalDataState {
  open: boolean;
  title?: string;
  uuid?: string;
}

interface ListModalDataState {
  listFeedback?: string;
  open: boolean;
}

interface FormDataState {
  motivation: string;
  uuid: string;
}

/**
 * Review-destruction-list page
 */
export function DestructionListReviewPage() {
  const { zaken, selectedZaken, uuid } =
    useLoaderData() as DestructionListReviewLoaderContext;
  const submit = useSubmit();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);

  const [zaakModalDataState, setZaakModalDataState] =
    useState<ZaakModalDataState>({
      open: false,
    });
  const [listModalDataState, setListModalDataState] =
    useState<ListModalDataState>({
      open: false,
    });

  const onSelect = async (row: AttributeData[], selected: boolean) => {
    const firstZaak = row[0] as unknown as Zaak;
    if (!selected) {
      await removeFromZaakSelection(destructionListReviewKey, [firstZaak]);
      return;
    }
    setZaakModalDataState({
      // TODO: Control the check/uncheck of the checkbox? Is this even necessary if we move away from checkboxes later on? It's quite some work.
      open: true,
      uuid: firstZaak.uuid,
      title: `Beoordeel zaak ${firstZaak.identificatie}`,
    });
  };

  const zaakModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Motivatie",
      name: "motivation",
      type: "text",
      required: true,
    },
  ];

  const listModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Lijst Motivatie",
      name: "list_feedback",
      type: "text",
      required: true,
    },
  ];

  /**
   * Gets called when the form is submitted.
   */
  const onSubmitZaakForm = async (_: FormEvent, data: AttributeData) => {
    const zaak = zaken.results.find((z) => z.uuid === zaakModalDataState.uuid)!;
    await addToZaakSelection<FormDataState>(destructionListReviewKey, [zaak], {
      ...(data as {
        motivation: string;
      }),
      uuid: zaakModalDataState.uuid!,
    });
    setZaakModalDataState({ open: false });
  };

  const onSubmitDestructionListForm = async (
    _: FormEvent,
    data: AttributeData,
  ) => {
    submit(
      {
        details: {
          listFeedback: data.list_feedback,
        },
      },
      { method: "POST", encType: "application/json" },
    );
  };

  return (
    <>
      <Modal
        title={zaakModalDataState.title}
        open={zaakModalDataState.open}
        size="m"
      >
        <Body>
          <Form
            fields={zaakModalFormFields}
            onSubmit={onSubmitZaakForm}
            validateOnChange={true}
          />
        </Body>
      </Modal>
      <Modal title={"Save"} open={listModalDataState.open} size="m">
        <Body>
          <Form
            fields={listModalFormFields}
            onSubmit={onSubmitDestructionListForm}
            validateOnChange
          />
        </Body>
      </Modal>
      <DestructionList
        storageKey={destructionListReviewKey}
        zaken={zaken}
        selectedZaken={selectedZaken}
        title={"Save"}
        onSubmitSelection={() => setListModalDataState({ open: true })}
        onSelect={onSelect}
      />
    </>
  );
}

export type DestructionListReviewLoaderContext = {
  reviewers: User[];
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  uuid: string;
};

/**
 * React Router loader.
 * @param request
 * @param params
 */
export const destructionListReviewLoader = async ({
  request,
  params,
}: LoaderFunctionArgs<DestructionListReviewLoaderContext>) => {
  const searchParams = new URL(request.url).searchParams;
  const uuid = params.uuid;
  if (!uuid) {
    return redirect("/destruction-lists/create"); // TODO: How do we want to handle this?
  }
  searchParams.set("destruction_list", uuid);

  const zaken = await listZaken(searchParams);
  const reviewers = await listReviewers();

  const isZaakSelectedPromises = zaken.results.map((zaak) =>
    isZaakSelected(getDestructionListReviewKey(uuid), zaak),
  );
  const isZaakSelectedResults = await Promise.all(isZaakSelectedPromises);
  const selectedZaken = zaken.results.filter(
    (_, index) => isZaakSelectedResults[index],
  );

  return {
    reviewers,
    zaken,
    selectedZaken,
    uuid,
  } satisfies DestructionListReviewLoaderContext;
};

type DestructionListReviewActionContext = {
  details: {
    listFeedback: string;
  };
};

/**
 * React Router action.
 * @param request
 * @param params
 */
export const destructionListReviewAction = async ({
  request,
  params,
}: ActionFunctionArgs<DestructionListReviewActionContext>) => {
  const details =
    (await request.json()) as DestructionListReviewActionContext["details"];
  const destructionListUuid = params.uuid;

  if (!destructionListUuid) {
    throw new Error("No uuid provided");
  }

  const storageKey = getDestructionListReviewKey(destructionListUuid as string);
  const searchParams = new URLSearchParams();
  searchParams.set("destruction_list", destructionListUuid);

  // Get data
  const promises = [getZaakSelection(storageKey)];

  const [zaakSelection] = (await Promise.all(promises)) as [ZaakSelection];

  const zaakSelectionValid = Object.values(zaakSelection).filter(
    (f) => f.selected,
  );

  const data: CreateDestructionListReviewData = {
    destructionList: destructionListUuid,
    decision: zaakSelectionValid.length > 0 ? "rejected" : "accepted",
    listFeedback: details.listFeedback,
    itemReviews: zaakSelectionValid.map((zaak) => {
      if (!zaak.detail) {
        throw new Error("Details are missing for one or more zaken");
      }
      const detail = zaak.detail as Record<string, string>;

      return {
        zaak: detail.uuid,
        feedback: detail.motivation,
      };
    }),
  };
  await createDestructionListReview(data);
  return redirect("/");
};
