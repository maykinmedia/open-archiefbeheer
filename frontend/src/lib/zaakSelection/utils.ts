import { isPrimitive } from "@maykin-ui/admin-ui";

import { ZaakIdentifier, ZaakSelection } from "./types";

export function _zaken2zaakSelection<DetailType>(
  zaken: Array<string | ZaakIdentifier>,
  selected: boolean,
  detail?: DetailType,
): ZaakSelection {
  return Object.fromEntries(
    _getZaakUrls(zaken).map((url, index) => [
      url,
      {
        selected: selected,
        detail: Array.isArray(detail) ? detail[index] : detail,
      },
    ]),
  );
}

/**
 * Returns the urls based on an `Array` of `string`s or `Zaak` objects.
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @private
 */
export function _getZaakUrls(zaken: Array<string | ZaakIdentifier>) {
  return zaken.map(_getZaakUrl);
}

/**
 * Returns the url based on a `string` or `Zaak` object.
 * @param zaak Either a `Zaak.url` or `Zaak` object.
 * @private
 */
export function _getZaakUrl(zaak: string | ZaakIdentifier) {
  return isPrimitive(zaak) ? zaak : zaak.url;
}
