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

/**
 * Returns the correct format for a user.
 * @param user
 */
export function formatUser(user: User) {
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName} (${user.username})`;
  return user.username;
}
