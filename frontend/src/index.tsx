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
import { appLoader } from "./App.loader";
import "./index.css";
import {
  DestructionListCreatePage,
  DestructionListDetailPage,
  DestructionListEditPage,
  DestructionListProcessReviewPage,
  DestructionListReviewPage,
  Landing,
  LoginPage,
  ShortProcedureSettingsPage,
  destructionListCreateAction,
  destructionListCreateLoader,
  destructionListDetailLoader,
  destructionListReviewAction,
  destructionListReviewLoader,
  destructionListUpdateAction,
  landingLoader,
  loginAction,
  logoutLoader,
  shortProcedureSettingsPageAction,
  shortProcedureSettingsPageLoader,
} from "./pages";

const router = createBrowserRouter([
  {
    path: "/",
    loader: appLoader,
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
        id: "destruction-list:detail",
        path: "/destruction-lists/:uuid",
        element: <DestructionListDetailPage />,
        loader: destructionListDetailLoader,
        children: [
          {
            path: "edit",
            element: <DestructionListEditPage />,
            action: destructionListUpdateAction, // FIXME: Split actions and allow components direct access to shared actions functions?
            handle: {
              breadcrumbItems: [
                {
                  label: "Vernietigingslijsten",
                  href: "/destruction-lists",
                },
                {
                  label: "{uuid}",
                  href: "/destruction-lists/{uuid}",
                },
                {
                  label: "Bewerken",
                  href: "/destruction-lists/{uuid}/edit",
                },
              ] as BreadcrumbItem[],
            },
          },
          {
            path: "process-review",
            element: <DestructionListProcessReviewPage />,
            action: destructionListUpdateAction, // FIXME: Split actions and allow components direct access to shared actions functions?
            handle: {
              breadcrumbItems: [
                {
                  label: "Vernietigingslijsten",
                  href: "/destruction-lists",
                },
                {
                  label: "{uuid}",
                  href: "/destruction-lists/{uuid}",
                },
                {
                  label: "Beoordeling bekijken",
                  href: "/destruction-lists/{uuid}/process-review",
                },
              ] as BreadcrumbItem[],
            },
          },
          {
            path: "review",
            loader: destructionListReviewLoader,
            element: <DestructionListReviewPage />,
            action: destructionListReviewAction,
            handle: {
              breadcrumbItems: [
                {
                  label: "Vernietigingslijsten",
                  href: "/destruction-lists",
                },
                {
                  label: "{uuid}",
                  href: "/destruction-lists/{uuid}",
                },
                {
                  label: "Beoordelen",
                  href: "/destruction-lists/{uuid}/review",
                },
              ] as BreadcrumbItem[],
            },
          },
        ],
      },
      {
        path: "/settings",
        element: <ShortProcedureSettingsPage />,
        loader: shortProcedureSettingsPageLoader,
        action: shortProcedureSettingsPageAction,
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
