import { StoryContext, StoryFn } from "@storybook/react";
import * as React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";

import App from "../src/App";

/**
 * Decorators providing React Router integration (RouterProvider), optionally: when using this decorator a parameter
 * "loader" can be specified providing React Router `LoaderFunction` for this `StoryFn`.
 */
export const ReactRouterDecorator = (
  Story: StoryFn,
  { parameters }: StoryContext,
) => {
  // Clear session storage
  // TODO: Make explicit decorator/parameter?
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i) || "";
    if (key.startsWith("oab")) {
      console.warn("REMOVING SESSIONSTORAGE", key);
      sessionStorage.removeItem(key);
    }
  }
  const { action, ...route } = parameters.reactRouterDecorator?.route || {
    action: () => true,
    loader: () => true,
  };
  const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      action,
      children: [
        {
          path: "*",
          element: <Story />,
          ...route,
        },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
};
