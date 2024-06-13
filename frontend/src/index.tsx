import { BreadcrumbItem } from "@maykin-ui/admin-ui";
import "@maykin-ui/admin-ui/style";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import App from "./App";
import "./index.css";
import {
  DestructionListCreatePage,
  DestructionListDetailPage,
  DestructionListReviewPage,
  Landing,
  LoginPage,
  destructionListCreateAction,
  destructionListCreateLoader,
  destructionListDetailLoader,
  destructionListReviewAction,
  destructionListReviewLoader,
  destructionListUpdateAction,
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
        element: <Navigate to="/destruction-lists"></Navigate>,
      },
      {
        path: "/destruction-lists",
        loader: landingLoader,
        element: <Landing />,
        handle: {
          breadcrumbItems: [
            {
              label: "Vernietigingslijsten",
              href: "/destruction-lists",
            },
          ] as BreadcrumbItem[],
        },
      },
      {
        path: "/destruction-lists/create",
        element: <DestructionListCreatePage />,
        action: destructionListCreateAction,
        loader: destructionListCreateLoader,
        handle: {
          breadcrumbItems: [
            {
              label: "Vernietigingslijsten",
              href: "/destruction-lists",
            },
            {
              label: "Aanmaken",
              href: "/destruction-lists/create",
            },
          ] as BreadcrumbItem[],
        },
      },
      {
        path: "/destruction-lists/:uuid",
        element: <DestructionListDetailPage />,
        action: destructionListUpdateAction,
        loader: destructionListDetailLoader,
        handle: {
          breadcrumbItems: [
            {
              label: "Vernietigingslijsten",
              href: "/destruction-lists",
            },
            {
              label: "{uuid}",
              href: "/destruction-lists/create",
            },
          ] as BreadcrumbItem[],
        },
      },
      {
        path: "/destruction-lists/:uuid/review",
        loader: destructionListReviewLoader,
        element: <DestructionListReviewPage />,
        action: destructionListReviewAction,
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
