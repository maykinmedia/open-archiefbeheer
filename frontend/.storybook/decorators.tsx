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
          path: "/iframe.html",
          element: <Story />,
          ...parameters.reactRouterDecorator?.route,
        },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
};
