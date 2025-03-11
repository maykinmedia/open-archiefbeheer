import { render } from "@testing-library/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";

test("renders app", () => {
  const router = createBrowserRouter([
    {
      path: "*",
      element: <App />,
    },
  ]);
  render(
    <RouterProvider
      // @ts-expect-error - v7_relativeSplatPath not in type
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      router={router}
    />,
  );
});
