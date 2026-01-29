import { Badge, ListTemplate, Outline, TypedField } from "@maykin-ui/admin-ui";
import { invariant } from "@maykin-ui/client-common";
import { useLoaderData, useSearchParams } from "react-router-dom";

import { API_BASE_URL } from "../../../lib/api/request";
import { formatDate } from "../../../lib/format/date";
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
    "datum vernietigd": list.end,
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
      valueTransform: (d) => formatDate(d["datum aangemaakt"]),
    },
    {
      name: "datum vernietigd",
      type: "daterange",
      filterLookup: "end",
      filterValue:
        searchParams.get("end__gte") && searchParams.get("end__lte")
          ? `${searchParams.get("end__gte")}/${searchParams.get("end__lte")}`
          : undefined,
      valueTransform: (d) =>
        d["datum vernietigd"] ? formatDate(d["datum vernietigd"]) : null,
    },
    {
      filterable: false,
      sortable: false,
      name: "vernietigingsrapport",
      type: "jsx",
      valueTransform: (object) => (
        <Badge href={object.vernietigingsrapport} variant="success" download>
          <Outline.CloudArrowDownIcon /> Download rapport
        </Badge>
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
  const onFilter = (filter: Record<keyof Row, string>) => {
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

  /**
   * Handles sorting.
   */
  const onSort = (sort: string) => {
    const fieldName = sort.replace("-", "");
    const field = fields.find((f) => f.name === fieldName);
    invariant(field, `Field ${fieldName} was not found!`);

    const sortLookup = field.filterLookup || field.name; // same.

    searchParams.set(
      "ordering",
      sort.startsWith("-") ? sortLookup : `-${sortLookup}`,
    );
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
        sort: true,
        onPageChange: handlePageChange,
        onFilter: onFilter,
        onSort: onSort,
      }}
    />
  );
}
