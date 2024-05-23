import "@maykin-ui/admin-ui/style";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import {
  DestructionListCreatePage,
  DestructionListDetailPage,
  Landing,
  LoginPage,
  destructionListCreateAction,
  destructionListCreateLoader,
  destructionListDetailLoader,
  landingLoader,
  loginAction,
  logoutLoader,
} from "./pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        loader: landingLoader,
        element: <Landing />,
      },
      {
        path: "/destruction-lists/create",
        element: <DestructionListCreatePage />,
        action: destructionListCreateAction,
        loader: destructionListCreateLoader,
      },
      {
        path: "/destruction-lists/:id",
        element: <DestructionListDetailPage />,
        // action: destructionListUpdateAction,
        loader: destructionListDetailLoader,
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
