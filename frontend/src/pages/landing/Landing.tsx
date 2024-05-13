import React from "react";
import { useLoaderData } from "react-router-dom";

import { loginRequired } from "../../lib/api/loginRequired";
import { listReviewers } from "../../lib/api/reviewers";
import "./Landing.css";

/**
 * React Router loader.
 * @param request
 */
export const landingLoader = loginRequired(listReviewers);

export type LandingProps = React.ComponentProps<"main"> & {
  // Props here.
};

/**
 * Landing page
 */
export function LandingPage({ children, ...props }: LandingProps) {
  const items = useLoaderData();

  return (
    <main className="LandingPage" {...props}>
      {JSON.stringify(items)}
    </main>
  );
}
