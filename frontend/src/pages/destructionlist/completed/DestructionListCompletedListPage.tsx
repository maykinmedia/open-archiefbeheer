import { A, ListTemplate, TypedField } from "@maykin-ui/admin-ui";
import { invariant } from "@maykin-ui/client-common";
import { useLoaderData, useSearchParams } from "react-router-dom";

import { API_BASE_URL } from "../../../lib/api/request";
import { DestructionListCompletedListContext } from "./DestructionListCompletedListPage.loader";

export function DestructionListCompletedListPage() {
  const { destructionLists } =
    useLoaderData() as DestructionListCompletedListContext;
  const { results, ...basePaginatorProps } = destructionLists;

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1");

  const objectList = results.map((list) => ({
    naam: list.name,
    opmerking: list.comment,
    "datum aangemaakt": list.created,
    "datum geplande vernietiging": list.plannedDestructionDate,
    vernietigingsrapport:
      API_BASE_URL + `/destruction-lists/${list.uuid}/download_report`,
  }));

  type Row = (typeof objectList)[number];

  const fields: TypedField<Row>[] = [
    {
      name: "naam",
      type: "string",
      filterLookup: "name",
      filterValue: searchParams.get("name") || "",
    },
    {
      name: "opmerking",
      type: "string",
      filterLookup: "comment",
      filterValue: searchParams.get("comment") || "",
    },
    {
      name: "datum aangemaakt",
      type: "daterange",
      filterLookup: "created",
      filterValue:
        searchParams.get("created__gte") && searchParams.get("created__lte")
          ? `${searchParams.get("created__gte")}/${searchParams.get("created__lte")}`
          : undefined,
    },
    {
      name: "datum geplande vernietiging",
      type: "daterange",
      filterLookup: "plannedDestructionDate",
      filterValue:
        searchParams.get("plannedDestructionDate__gte") &&
        searchParams.get("plannedDestructionDate__lte")
          ? `${searchParams.get("plannedDestructionDate__gte")}/${searchParams.get("plannedDestructionDate__lte")}`
          : undefined,
    },
    {
      filterable: false,
      name: "vernietigingsrapport",
      type: "jsx",
      valueTransform: (object) => (
        <A href={object.vernietigingsrapport} download>
          Download
        </A>
      ),
    },
  ];

  /**
   * Handles page change.
   * @param page
   */
  const handlePageChange = (page: number) => {
    searchParams.set("page", page.toString());
    setSearchParams(searchParams);
  };

  /**
   * Handles filter.
   * @param filter
   */
  const onFilterChange = (filter: Record<keyof Row, string>) => {
    for (const key of Object.keys(filter) as Array<keyof typeof filter>) {
      const rawValue = filter[key];

      const typedField = fields.find(
        (f) => f.filterLookup == key || f.name === key,
      );
      invariant(typedField, `Field ${key} was not found!`);

      if (typedField.type === "daterange") {
        const [gte, lte] = rawValue.split("/");
        if (gte && lte) {
          searchParams.set(key + "__gte", gte);
          searchParams.set(key + "__lte", lte);
        } else {
          searchParams.delete(key + "__gte");
          searchParams.delete(key + "__lte");
        }
      } else {
        if (rawValue) {
          searchParams.set(key, rawValue);
        } else {
          searchParams.delete(key);
        }
      }
    }
    setSearchParams(searchParams);
  };

  return (
    <ListTemplate
      dataGridProps={{
        title: "Afgeronde vernietigingslijsten",
        fields,
        objectList,
        filterable: true,
        paginatorProps: { ...basePaginatorProps, page, pageSize: 100 },
        onPageChange: handlePageChange,
        onFilter: onFilterChange,
      }}
    />
  );
}
