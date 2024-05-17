import {
  AttributeData,
  Button,
  DataGridProps,
  H2,
  Input,
  ListTemplate,
  TypedField,
} from "@maykin-ui/admin-ui";
import { ActionFunctionArgs } from "@remix-run/router/utils";
import React, { useState } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router-dom";

import { createDestructionList } from "../../lib/api/destructionLists";
import { loginRequired } from "../../lib/api/loginRequired";
import { ZaaktypeChoice, listZaaktypeChoices } from "../../lib/api/private";
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

    // Get zaken and zaaktypen.
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

    return { zaken, selectedZaken, zaaktypeChoices };
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
  return true;
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
  const { zaken, selectedZaken, zaaktypeChoices } =
    useLoaderData() as DestructionListCreateContext;
  const errors = useActionData() || {};
  const submit = useSubmit();

  const [searchParams, setSearchParams] = useSearchParams();
  const objectList = zaken.results as unknown as AttributeData[];
  const { state } = useNavigation();

  const [isEditingNameState, setIsEditingNameState] = useState(true);
  const [nameState, setNameState] = useState("Naam van de vernietigingslijst");

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
  const onCreate = async () => {
    const zaakSelection = await getZaakSelection(DESTRUCTION_LIST_CREATE_KEY);
    const zaakUrls = Object.entries(zaakSelection)
      .filter(([, selected]) => selected)
      .map(([url]) => url);
    const assigneeIds = [1]; // TODO: Add a modal with actual assignees

    const data = new FormData();
    data.append("name", nameState);
    zaakUrls.forEach((url) => data.append("zaakUrls", url));
    assigneeIds.forEach((id) => data.append("assigneeIds", String(id)));

    submit(data, { method: "POST" });
  };

  return (
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
              onClick: onCreate,
              wrap: false,
            },
          ],
          labelSelect: `Zaak {identificatie} toevoegen aan selectie`,
          labelSelectAll: "Selecteer {countPage} op pagina",
          title: isEditingNameState ? (
            <Input
              aria-label="Voer de naam van de vernietigingslijst in"
              autoFocus={true}
              value={nameState}
              onChange={(e) => setNameState(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => setIsEditingNameState(false)}
              onKeyUp={(e) =>
                e.code === "Enter" && setIsEditingNameState(false)
              }
            />
          ) : (
            <Button
              pad={false}
              variant="transparent"
              onClick={() => setIsEditingNameState(true)}
            >
              <H2>{nameState}</H2>
            </Button>
          ),
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
  );
}
