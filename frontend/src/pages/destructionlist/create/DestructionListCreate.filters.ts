import { date2DateString } from "@maykin-ui/admin-ui";

type ArchiveDateMode = "all" | "past" | "custom";

/**
 * Determines the current archiefactiedatum filter mode from the URL search params.
 *
 * Returns:
 * - "all": No archive date filters are active. (the user clicks on "Toon ook zaken met toekomstige archiefdatum" button).
 * - "past": Shows archivable cases. The default.
 * - "custom": The user has applied custom Archiefactiedatum filters.
 */
export const getArchiveDateMode = (
  searchParams: URLSearchParams,
): ArchiveDateMode => {
  if (searchParams.get("showAll") === "true") {
    return "all";
  }

  const fromDate = searchParams.get("archiefactiedatum__gte");
  const toDate = searchParams.get("archiefactiedatum__lte");

  if (!fromDate && !toDate) {
    return "past";
  }

  const today = new Date();
  if (!fromDate && toDate && new Date(toDate) <= today) {
    return "past";
  }

  return "custom";
};

/**
 * Returns the zaak filters to send to the API.
 */
export const getZaakFilters = (
  searchParams: URLSearchParams,
): URLSearchParams => {
  const filters = new URLSearchParams(searchParams);
  const archiveDateMode = getArchiveDateMode(searchParams);

  // Remove the UI-only param
  filters.delete("showAll");

  // "past" is a default mode in the UI, but not in the API
  if (
    archiveDateMode === "past" &&
    !filters.has("archiefactiedatum__gte") &&
    !filters.has("archiefactiedatum__lte")
  ) {
    filters.set("archiefactiedatum__lte", date2DateString(new Date()));
  }

  return filters;
};
