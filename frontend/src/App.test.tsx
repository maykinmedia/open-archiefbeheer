import { render } from "@testing-library/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import { HealthCheckResult } from "./lib/api/health-check";
import { mockResponseOnce } from "./lib/test/mockResponse";

test("renders app", () => {
  const result: HealthCheckResult = {
    message: "",
    success: true,
    identifier: "",
  };
  mockResponseOnce("get", "http://localhost:8000/api/v1/health-check", result);

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
