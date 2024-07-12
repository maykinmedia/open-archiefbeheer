import { User, whoAmI } from "../../lib/api/auth";
import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { loginRequired } from "../../lib/auth/loaders";
import { STATUS_MAPPING } from "../destructionlist/detail/constants";
import { STATUSES } from "./Landing";
import "./Landing.css";

export interface LandingLoaderReturn {
  statusMap: { [key: string]: DestructionList[] };
  user: User;
}

export const landingLoader = loginRequired(
  async (): Promise<LandingLoaderReturn> => {
    const listsPromise = listDestructionLists();
    const userPromise = whoAmI();

    const [lists, user] = await Promise.all([listsPromise, userPromise]);
    // Initialize statusMap with empty arrays for each status
    const statusMap = STATUSES.reduce((acc, val) => {
      const status = val[0] || "";
      const destructionLists = lists.filter(
        (l) => STATUS_MAPPING[l.status] === status,
      );
      return { ...acc, [status]: destructionLists };
    }, {});

    return {
      statusMap,
      user,
    };
  },
);
