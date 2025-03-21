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
    const abortController = new AbortController();
    const url = new URL(request.url);
    const urlSearchParams = url.searchParams;
    const statusMap = await getStatusMap(urlSearchParams);
    const user = await whoAmI(abortController.signal);

    return {
      statusMap,
      user,
    };
  },
);

export const getStatusMap = async (urlSearchParams: URLSearchParams) => {
  if (!urlSearchParams.has("ordering")) {
    urlSearchParams.set("ordering", "-created");
  }
  const lists = await listDestructionLists(urlSearchParams);
  return STATUSES.reduce((acc, [status]) => {
    const destructionLists = lists.filter(
      (l) => STATUS_MAPPING[l.status] === status,
    );
    return { ...acc, [status || ""]: destructionLists };
  }, {});
};
