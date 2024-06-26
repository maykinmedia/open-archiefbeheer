import { render } from "@testing-library/react";
import * as React from "react";
import { createBrowserRouter } from "react-router-dom";

import App from "./App";

test("renders app", () => {
  createBrowserRouter([
    {
      path: "*",
      element: <App />,
    },
  ]);
  render(<App />);
});
