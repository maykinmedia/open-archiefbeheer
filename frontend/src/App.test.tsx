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
  render(<RouterProvider router={router} />);
});
