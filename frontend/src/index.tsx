import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { loginRequired } from "./lib/api/loginRequired";
import { listReviewers } from "./lib/api/reviewers";
import { LandingPage, LoginPage, landingLoader, loginAction } from "./pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    loader: landingLoader,
  },
  {
    path: "/login",
    element: <LoginPage />,
    action: loginAction,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App>
      <RouterProvider router={router} />
    </App>
  </React.StrictMode>,
);
