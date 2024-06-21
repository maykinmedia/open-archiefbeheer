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
 * @param showRole
 */
export function formatUser(user: User, showRole = false) {
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName} (${user.username})`
      : user.username;

  if (showRole && user.role.name) {
    return `${displayName} (${user.role.name})`;
  }
  return displayName;
}
