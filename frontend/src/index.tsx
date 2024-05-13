import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import {
  LandingPage,
  LoginPage,
  landingLoader,
  loginAction,
  logoutLoader,
} from "./pages";

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
  {
    path: "/logout",
    loader: logoutLoader,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App>
      <RouterProvider router={router} />
    </App>
  </React.StrictMode>,
);
