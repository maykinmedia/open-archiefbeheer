import { LoaderFunction } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { formatUser } from "../../pages/destructionlist/utils";
import { whoAmI } from "../api/auth";
import { DestructionList } from "../api/destructionLists";
import {
  canReviewDestructionList,
  canStartDestructionList,
  canUpdateDestructionList,
} from "./permissions";

export type ContextLoaderFunction<T extends object = object> = (
  ...args: Parameters<LoaderFunction>
) => Promise<T>;

/**
 * Wraps an existing loader with authentication protection. Redirects to the sign-in page if the request fails with a
 * 403 status code.
 * @param fn The async API function to be wrapped.
 * @returns A function that, when called, executes the wrapped async API function with the provided arguments.
 */
export function loginRequired<T extends object>(
  fn: LoaderFunction,
): LoaderFunction<T | Response> {
  return async (loaderFunctionArgs, handlerCtx) => {
    try {
      return await fn(loaderFunctionArgs, handlerCtx);
    } catch (e: unknown) {
      const url = new URL(window.location.toString());
      if ((e as Response)?.status === 403) {
        const next = url.searchParams.get("next")
          ? "/"
          : new URL(loaderFunctionArgs.request.url).pathname;
        return redirect(`/login?next=${next}`);
      }
      throw e;
    }
  };
}

/**
 * Wraps an existing loader with `canReviewDestructionList` permission check *
 *  - Throws a 404 response if wrapped loader does not return a `destructionList`.
 *  - Throws a 403 response if `destructionList` from wrapped loader is not reviewable by user.
 * @param fn The async API function to be wrapped.
 * @returns A function that, when called, executes the wrapped async API function with the provided arguments.
 */
export function canStartDestructionListRequired<T extends object>(
  fn: LoaderFunction,
): LoaderFunction<T | Response> {
  return async (loaderFunctionArgs, handlerCtx) => {
    const user = await whoAmI();
    if (!canStartDestructionList(user)) {
      throw new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om vernietigingslijsten aan te maken.`,
      });
    }

    return await fn(loaderFunctionArgs, handlerCtx);
  };
}

/**
 * Wraps an existing loader with `canReviewDestructionList` permission check *
 *  - Throws a 404 response if wrapped loader does not return a `destructionList`.
 *  - Throws a 403 response if `destructionList` from wrapped loader is not reviewable by user.
 * @param fn The async API function to be wrapped.
 * @returns A function that, when called, executes the wrapped async API function with the provided arguments.
 */
export function canReviewDestructionListRequired<
  T extends { destructionList: DestructionList },
>(fn: ContextLoaderFunction<T>): ContextLoaderFunction<T> {
  return async (loaderFunctionArgs, handlerCtx) => {
    const data = await fn(loaderFunctionArgs, handlerCtx);

    const destructionList = data.destructionList;
    if (!destructionList) {
      throw new Response("Not Found", { status: 404 });
    }

    const user = await whoAmI();
    if (!canReviewDestructionList(user, destructionList)) {
      throw new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te beoordelen.`,
      });
    }

    return data;
  };
}

/**
 * Wraps an existing loader with `canUpdateDestructionList` permission check
 *  - Throws a 404 response if wrapped loader does not return a `destructionList`.
 *  - Throws a 403 response if `destructionList` from wrapped loader is not editable by user.
 * @param fn The async API function to be wrapped.
 * @returns A function that, when called, executes the wrapped async API function with the provided arguments.
 */
export function canUpdateDestructionListRequired<
  T extends { destructionList: DestructionList },
>(fn: ContextLoaderFunction<T>): ContextLoaderFunction<T> {
  return async (loaderFunctionArgs, handlerCtx) => {
    const data = await fn(loaderFunctionArgs, handlerCtx);

    const destructionList = data.destructionList;
    if (!destructionList) {
      throw new Response("Not Found", { status: 404 });
    }

    const user = await whoAmI();
    if (!canUpdateDestructionList(user, destructionList)) {
      throw new Response("Not Permitted", {
        status: 403,
        statusText: `Gebruiker ${formatUser(user)} heeft onvoldoende rechten om deze lijst te te bewerken.`,
      });
    }

    return data;
  };
}
