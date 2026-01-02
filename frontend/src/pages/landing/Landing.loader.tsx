import { User, whoAmI } from "../../lib/api/auth";
import {
  DestructionList,
  getDestructionListsKanban,
} from "../../lib/api/destructionLists";
import { loginRequired } from "../../lib/auth/loaders";
import "./Landing.css";

export interface LandingContext {
  statusMap: { [key: string]: DestructionList[] };
  user: User;
}

export const landingLoader = loginRequired(
  async ({ request }): Promise<LandingContext> => {
    const url = new URL(request.url);

    const urlSearchParams = url.searchParams;
    if (!urlSearchParams.has("ordering")) {
      urlSearchParams.set("ordering", "-created");
    }

    const statusMap = await getDestructionListsKanban(
      urlSearchParams,
      request.signal,
    );
    const user = await whoAmI(request.signal);

    return {
      statusMap,
      user,
    };
  },
);
