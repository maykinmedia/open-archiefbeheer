import { isPrimitive } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { ZaakSelection } from "./types";

export function _zaken2zaakSelection<DetailType>(
  zaken: Array<string | Zaak>,
  selected: boolean,
  detail?: DetailType,
): ZaakSelection {
  return Object.fromEntries(
    _getZaakUrls(zaken).map((url) => [url, { selected: selected, detail }]),
  );
}

/**
 * Returns the urls based on an `Array` of `string`s or `Zaak` objects.
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @private
 */
export function _getZaakUrls(zaken: Array<string | Zaak>) {
  return zaken.map(_getZaakUrl);
}

/**
 * Returns the url based on a `string` or `Zaak` object.
 * @param zaak Either a `Zaak.url` or `Zaak` object.
 * @private
 */
export function _getZaakUrl(zaak: string | Zaak) {
  return isPrimitive(zaak) ? zaak : (zaak.url as string);
}
