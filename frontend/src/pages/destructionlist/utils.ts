import { AttributeData } from "@maykin-ui/admin-ui";

import { User } from "../../lib/api/auth";
import {
  addToZaakSelection,
  removeFromZaakSelection,
} from "../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../types";

export async function updateSelectedZaken(
  selected: boolean,
  attributeData: AttributeData[],
  destructionListKey: string,
  zaken: Zaak[],
) {
  selected
    ? await addToZaakSelection(
        destructionListKey,
        attributeData as unknown as Zaak[],
      )
    : await removeFromZaakSelection(
        destructionListKey,
        attributeData.length ? (attributeData as unknown as Zaak[]) : zaken,
      );
}
