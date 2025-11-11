import { LoaderFunction } from "@remix-run/router/utils";
import { StoryContext, StoryFn } from "@storybook/react-vite";
import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";

import App from "../src/App";

/**
 * Decorators removing all session storage items which key starts with "oab.".
 */
export const ClearSessionStorageDecorator = (Story: StoryFn) => {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith("oab."))
    .forEach((key) => {
      console.info(`ClearSessionStorageDecorator: removing item "${key}"`);
      sessionStorage.removeItem(key);
    });
  return <Story />;
};

/**
 * Decorators providing React Router integration (RouterProvider), optionally: when using this decorator a parameter
 * "loader" can be specified providing React Router `LoaderFunction` for this `StoryFn`.
 * @param parameters.reactRouterDecorator.route Route configuration to navigate to.
 * @param parameters.reactRouterDecorator.params Router params to apply to route.
 */
export const ReactRouterDecorator = (
  Story: StoryFn,
  { parameters }: StoryContext,
) => {
  const { route, params } = parameters?.reactRouterDecorator || {};

  // The loader to use for the decorated Story.
  const parameterizedLoader = route?.loader
    ? ((async (context) => {
        // Apply (route) params to original loader.
        return route.loader({
          request: context.request,
          params: {
            ...context.params,
            ...params,
          },
        });
      }) as LoaderFunction)
    : undefined;

  // Build router structure.
  const router = createBrowserRouter([
    {
      path: "",
      element: <App />,
      action: async (...args) => {
        await parameters.reactRouterDecorator?.route?.action?.(...args);
        return redirect("/iframe.html");
      },
      children: [
        {
          id: route?.id,
          path: "/iframe.html", // Storybook uses this URL.
          element: <Story />,
          ...(route || {}),
          loader: parameterizedLoader,
        },
        {
          path: "*?", // On redirect.
          Component: () => {
            const container = window.frameElement
              ? // @ts-expect-error - This does exist.
                window.frameElement.contentWindow
              : window;
            container.history.go(-1);
          },
          ...params,
          id: "foo",
        },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
};
