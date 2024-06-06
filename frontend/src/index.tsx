import "@maykin-ui/admin-ui/style";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import {
  DestructionListCreatePage,
  Landing,
  LoginPage,
  ReviewDestructionListPage,
  destructionListCreateAction,
  destructionListCreateLoader,
  landingLoader,
  loginAction,
  logoutLoader,
  reviewDestructionListAction,
  reviewDestructionListLoader,
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
        path: "/destruction-lists/:id/review",
        loader: reviewDestructionListLoader,
        element: <ReviewDestructionListPage />,
        action: reviewDestructionListAction,
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
