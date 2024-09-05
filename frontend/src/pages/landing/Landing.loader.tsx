import { User, whoAmI } from "../../lib/api/auth";
import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { loginRequired } from "../../lib/auth/loaders";
import { STATUS_MAPPING } from "../constants";
import { STATUSES } from "./Landing";
import "./Landing.css";

export interface LandingContext {
  statusMap: { [key: string]: DestructionList[] };
  user: User;
}

export const landingLoader = loginRequired(
  async ({ request }): Promise<LandingContext> => {
    const url = new URL(request.url);
    const queryParams = url.searchParams;
    const orderQuery = queryParams.get("ordering");
    const statusMap = await getStatusMap(orderQuery);
    const user = await whoAmI();

    return {
      statusMap,
      user,
    };
  },
);

export const getStatusMap = async (orderQuery: string | null) => {
  const lists = await listDestructionLists({
    ordering: orderQuery ?? "",
  });
  return STATUSES.reduce((acc, val) => {
    const status = val[0] || "";
    const destructionLists = lists.filter(
      (l) => STATUS_MAPPING[l.status] === status,
    );
    return { ...acc, [status]: destructionLists };
  }, {});
};
