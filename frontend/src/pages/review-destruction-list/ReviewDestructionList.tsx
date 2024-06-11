import {
  Body,
  Form,
  FormField,
  Modal,
  SerializedFormData,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useSubmit,
} from "react-router-dom";

import { DestructionList } from "../../components";
import { ZaaktypeChoice, listZaaktypeChoices } from "../../lib/api/private";
import { User, listReviewers } from "../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../lib/api/zaken";
import {
  getZaakSelection,
  isZaakSelected,
} from "../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../types";
import "./ReviewDestructionList.css";

const getDestructionListReviewKey = (id: string) =>
  `destruction-list-review-${id}`;

interface FormDataState {
  archief_informatie: string;
  reason?: string;
  date?: string;
  other_reason?: string;
}

export type ReviewDestructionListPageProps = React.ComponentProps<"main"> & {
  // Props here.
};

/**
 * Review-destruction-list page
 */
export function ReviewDestructionListPage({
  ...props
}: ReviewDestructionListPageProps) {
  const { reviewers, zaken, selectedZaken, zaaktypeChoices, uuid } =
    useLoaderData() as DestructionListReviewLoaderContext;
  const submit = useSubmit();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);

  const [modalDataState, setModalDataState] = useState<{
    open: boolean;
    title?: string;
  }>({
    open: false,
    title: "",
  });
  const [formData, setFormData] = useState<FormDataState>();

  const onSubmitSelection = async () => {
    const zaakSelection = await getZaakSelection(destructionListReviewKey); // Note: possible loading state required in future?
    const selectedZakenCount = Object.values(zaakSelection).filter(
      (selected) => selected,
    ).length;
    const zakenOrZaak = selectedZakenCount === 1 ? "zaak" : "zaken";
    setModalDataState({
      open: true,
      title: `Beoordeel zaken (${selectedZakenCount} ${zakenOrZaak})`,
    });
  };

  const modalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: modalDataState?.open,
      label: "Archief Informatie",
      name: "archief_informatie",
      type: "radio", // TODO: Radio not implemented yet (I think?)
      options: [
        { label: "Vernietigen uitstellen", value: "true" },
        { label: "Niet vernietigen", value: "false" },
        // If we check "true" then we should show a date field to select the date when the destruction should be done.
        // If we check "false" then we should show a (combobox) text/select field to enter the reason why the destruction should not be done. (which is required)
      ],
      required: true,
    },
    ...(formData?.archief_informatie === "false"
      ? [
          {
            label: "Reden",
            name: "reason",
            type: "select",
            options: [
              { label: "Nog rechtzaak lopend", value: "rechtzaak" },
              {
                label: "Geen toestemming van de eigenaar",
                value: "toestemming",
              },
              {
                label: "Andere reden",
                value: "other",
              },
            ], // TODO: From backend these options?
            required: true,
          },
          ...(formData?.reason === "other"
            ? [
                {
                  label: "Andere reden",
                  name: "other_reason",
                  type: "text",
                  required: true,
                },
              ]
            : []),
        ]
      : [
          {
            label: "", // Design has no label for this field.
            name: "date",
            type: "date",
            required: true,
          },
        ]),
  ];

  /**
   * Gets called when the form is submitted.
   */
  const onSubmitForm = async (event: FormEvent, data: SerializedFormData) => {
    const zaakSelection = await getZaakSelection(destructionListReviewKey);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selected]) => selected)
      .map(([url]) => url);
    const formData = data as unknown as FormDataState;

    submit(
      {
        ...formData,
        zaken: zaakUrls,
      },
      { method: "POST", encType: "application/json" },
    );
    setModalDataState({ open: false });
  };

  return (
    <>
      <Modal
        title={modalDataState.title}
        open={modalDataState.open}
        size="m"
        onClose={() => setModalDataState({ open: false })}
      >
        <Body>
          <Form
            fields={modalFormFields}
            onSubmit={onSubmitForm}
            validate={(values) =>
              setFormData(values as unknown as FormDataState)
            }
            validateOnChange={true}
          />
        </Body>
      </Modal>
      <DestructionList
        storageKey={destructionListReviewKey}
        zaken={zaken}
        selectedZaken={selectedZaken}
        title="Vernietigingslijst reviewen"
        onSubmitSelection={onSubmitSelection}
      />
    </>
  );
}

export type DestructionListReviewLoaderContext = {
  reviewers: User[];
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  zaaktypeChoices: ZaaktypeChoice[];
  uuid: string;
};

/**
 * React Router loader.
 * @param request
 * @param params
 */
export const reviewDestructionListLoader = async ({
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
  const zaaktypeChoices = await listZaaktypeChoices();

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
    zaaktypeChoices,
    uuid,
  } satisfies DestructionListReviewLoaderContext;
};

interface DestructionListReviewActionContext extends FormDataState {
  zaken: string[];
}

/**
 * React Router action.
 * @param request
 */
export const reviewDestructionListAction = async ({
  request,
}: ActionFunctionArgs<DestructionListReviewActionContext>) => {
  const data = (await request.json()) as FormDataState & { zaken: string[] };
  // We validate that we indeed have `zaken` in the data.
  if (!data.zaken) {
    throw new Error("No zaken provided."); // TODO: How to handle?
  }
  const { zaken, ...rest } = data;
  alert(`NOT IMPLEMENTED YET -> Data: ${JSON.stringify(rest)}`);
  return null;
};
