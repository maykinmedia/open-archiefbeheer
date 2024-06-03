import {
  AttributeData,
  Body,
  DataGridProps,
  Form,
  FormField,
  ListTemplate,
  Modal,
  SerializedFormData,
  TypedField,
} from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import React, { FormEvent, useState } from "react";
import {
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router-dom";

import { createDestructionList } from "../../lib/api/destructionLists";
import { loginRequired } from "../../lib/api/loginRequired";
import { ZaaktypeChoice, listZaaktypeChoices } from "../../lib/api/private";
import { User, listReviewers } from "../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../lib/api/zaken";
import {
  addToZaakSelection,
  clearZaakSelection,
  getZaakSelection,
  isZaakSelected,
  removeFromZaakSelection,
} from "../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../types";
import "./DestructionListCreate.css";

/** We need a key to store the zaak selection to, however we don't have a destruction list name yet. */
const DESTRUCTION_LIST_CREATE_KEY = "tempDestructionList";

export type DestructionListCreateContext = {
  reviewers: User[];
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  zaaktypeChoices: ZaaktypeChoice[];
};

/**
 * React Router loader.
 * @param request
 */
export const destructionListCreateLoader = loginRequired(
  async ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    searchParams.set("not_in_destruction_list", "true");

    // Get reviewers, zaken and zaaktypen.
    const reviewers = await listReviewers();
    const zaken = await listZaken(searchParams);
    const zaaktypeChoices = await listZaaktypeChoices();

    // Get zaak selection.
    const isZaakSelectedPromises = zaken.results.map((zaak) =>
      isZaakSelected(DESTRUCTION_LIST_CREATE_KEY, zaak),
    );
    const isZaakSelectedResults = await Promise.all(isZaakSelectedPromises);
    const selectedZaken = zaken.results.filter(
      (_, index) => isZaakSelectedResults[index],
    );

    return { reviewers, zaken, selectedZaken, zaaktypeChoices };
  },
);

/**
 * React Router action.
 * @param request
 */
export async function destructionListCreateAction({
  request,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const zaakUrls = formData.getAll("zaakUrls") as string[];
  const assigneeIds = formData.getAll("assigneeIds") as string[];

  try {
    await createDestructionList(name, zaakUrls, assigneeIds);
  } catch (e: unknown) {
    return await (e as Response).json();
  }
  await clearZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
  return redirect("/");
}

export type DestructionListCreateProps = Omit<
  React.ComponentProps<"main">,
  "onChange" | "onSelect"
>;

/**
 * Destruction list creation page
 */
export function DestructionListCreatePage({
  ...props
}: DestructionListCreateProps) {
  // Loader/Action I/O.
  const { reviewers, zaken, selectedZaken, zaaktypeChoices } =
    useLoaderData() as DestructionListCreateContext;
  const errors = useActionData() || {};
  const submit = useSubmit();

  const [searchParams, setSearchParams] = useSearchParams();
  const objectList = zaken.results as unknown as AttributeData[];
  const { state } = useNavigation();

  const [modalOpenState, setModalOpenState] = useState(false);

  const fields: TypedField[] = [
    {
      name: "identificatie",
      filterLookup: "identificatie__icontains",
      filterValue: searchParams.get("identificatie__icontains") || "",
      type: "string",
    },
    {
      name: "zaaktype",
      filterLookup: "zaaktype",
      filterValue: searchParams.get("zaaktype") || "",
      valueLookup: "_expand.zaaktype.omschrijving",
      options: zaaktypeChoices,
      type: "string",
    },
    {
      name: "omschrijving",
      filterLookup: "omschrijving__icontains",
      filterValue: searchParams.get("omschrijving__icontains") || "",
      type: "string",
    },
    {
      name: "looptijd",
      filterable: false,
      valueTransform: (rowData) => {
        const zaak = rowData as unknown as Zaak;
        const startDate = new Date(zaak.startdatum);
        const endDate = zaak.einddatum ? new Date(zaak.einddatum) : new Date();
        return (
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + " dagen"
        );
      },
      type: "string",
    },
    {
      name: "resultaattype",
      filterLookup: "resultaat__resultaattype__omschrijving__icontains",
      filterValue:
        searchParams.get("resultaat__resultaattype__omschrijving__icontains") ||
        "",
      valueLookup: "_expand.resultaat._expand.resultaattype.omschrijving",
      type: "string",
    },
    {
      name: "bewaartermijn",
      filterLookup: "resultaat__resultaattype__archiefactietermijn__icontains",
      filterValue:
        searchParams.get(
          "resultaat__resultaattype__archiefactietermijn__icontains",
        ) || "",
      valueLookup:
        "_expand.resultaat._expand.resultaattype.archiefactietermijn",
      type: "string",
    },
    {
      name: "vcs",
      filterLookup: "zaaktype__selectielijstprocestype__naam__icontains",
      filterValue:
        searchParams.get(
          "zaaktype__selectielijstprocestype__naam__icontains",
        ) || "",
      valueLookup: "_expand.zaaktype.selectielijstProcestype.naam",
      type: "string",
    },
    {
      name: "relaties",
      filterLookup: "heeft_relaties",
      valueTransform: (rowData) =>
        Boolean((rowData as unknown as Zaak)?.relevanteAndereZaken?.length),
      filterValue: searchParams.get("heeft_relaties") || "",
      type: "boolean",
      options: [
        { value: "true", label: "Ja" },
        { value: "false", label: "Nee" },
      ],
    },
  ];

  /**
   * Gets called when a filter value is change.
   * @param filterData
   */
  const onFilter = (filterData: AttributeData<string>) => {
    const combinedParams = {
      ...Object.fromEntries(searchParams),
      ...filterData,
    };

    const activeParams = Object.fromEntries(
      Object.entries(combinedParams).filter(([k, v]) => v),
    );

    setSearchParams(activeParams);
  };

  /**
   * Gets called when the selection is changed.
   * @param attributeData
   * @param selected
   */
  const onSelect = async (
    attributeData: AttributeData[],
    selected: boolean,
  ) => {
    selected
      ? await addToZaakSelection(
          DESTRUCTION_LIST_CREATE_KEY,
          attributeData as unknown as Zaak[],
        )
      : await removeFromZaakSelection(
          DESTRUCTION_LIST_CREATE_KEY,
          attributeData.length
            ? (attributeData as unknown as Zaak[])
            : zaken.results,
        );
  };

  /**
   * Get called when the selection is submitted.
   */
  const onSubmitSelection = () => setModalOpenState(true);

  /**
   * Gets called when the form is submitted.
   */
  const onSubmitForm = async (event: FormEvent, data: SerializedFormData) => {
    const zaakSelection = await getZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selected]) => selected)
      .map(([url]) => url);
    const { name, assigneeIds } = data;

    const formData = new FormData();
    formData.append("name", name as string);
    zaakUrls.forEach((url) => formData.append("zaakUrls", url));
    (assigneeIds as string[]).forEach((id) =>
      formData.append("assigneeIds", String(id)),
    );

    submit(formData, { method: "POST" });
    setModalOpenState(false);
  };

  const modalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: modalOpenState,
      label: "Naam",
      name: "name",
      required: true,
    },
    {
      label: "Eerste reviewer",
      name: "assigneeIds",
      options: reviewers.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
    {
      label: "Tweede reviewer",
      name: "assigneeIds",
      options: reviewers.map((user) => ({
        value: String(user.pk),
        label: user.username,
      })),
      required: true,
    },
  ];

  return (
    <>
      <Modal
        title="Vernietigingslijst starten"
        open={modalOpenState}
        size="m"
        onClose={() => setModalOpenState(false)}
      >
        <Body>
          <Form
            fields={modalFormFields}
            onSubmit={onSubmitForm}
            validateOnChange={true}
          />
        </Body>
      </Modal>
      <ListTemplate
        errors={Object.values(errors)}
        dataGridProps={
          {
            count: zaken.count,
            fields: fields,
            loading: state === "loading",
            objectList: objectList,
            pageSize: 100,
            showPaginator: true,
            selectable: true,
            selected: selectedZaken as unknown as AttributeData[],
            selectionActions: [
              {
                children: "Vernietigingslijst aanmaken",
                onClick: onSubmitSelection,
                wrap: false,
              },
            ],
            labelSelect: `Zaak {identificatie} toevoegen aan selectie`,
            labelSelectAll: "Selecteer {countPage} op pagina",
            title: "Vernietigingslijst opstellen",
            boolProps: {
              explicit: true,
            },
            filterable: true,
            page: Number(searchParams.get("page")) || 1,
            onFilter: onFilter,
            onSelect: onSelect,
            onPageChange: (page) =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: String(page),
              }),
          } as DataGridProps
        }
        {...props}
      />
    </>
  );
}
