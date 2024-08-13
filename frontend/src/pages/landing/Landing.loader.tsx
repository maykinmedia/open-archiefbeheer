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
  async (): Promise<LandingContext> => {
    const statusMap = await getStatusMap();
    const user = await whoAmI();

    return {
      statusMap,
      user,
    };
  },
);

export const getStatusMap = async () => {
  const lists = await listDestructionLists();
  return STATUSES.reduce((acc, val) => {
    const status = val[0] || "";
    const destructionLists = lists.filter(
      (l) => STATUS_MAPPING[l.status] === status,
    );
    return { ...acc, [status]: destructionLists };
  }, {});
};
