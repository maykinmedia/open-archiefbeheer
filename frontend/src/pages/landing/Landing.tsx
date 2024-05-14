import { redirect } from "react-router-dom";

import "./Landing.css";

/**
 * React Router loader.
 * @param request
 * TOOD: Requires destruction list lists endpoint.
 */
export const landingLoader = () => redirect("/destruction-lists/create");
