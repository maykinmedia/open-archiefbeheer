import { useEffect } from "react";
import {
  Outlet,
  useLoaderData,
  useNavigate,
  useOutlet,
} from "react-router-dom";

import { DestructionListDetailContext } from "./DestructionListDetail.loader";

/**
 * Destruction list detail page
 */
export function DestructionListDetailPage() {
  const { destructionList } = useLoaderData() as DestructionListDetailContext;
  const navigate = useNavigate();
  const outlet = useOutlet();

  // Redirect
  useEffect(() => {
    if (!outlet) {
      const isInReview = destructionList.status === "changes_requested";

      if (isInReview) {
        navigate("process-review");
      } else {
        navigate("edit");
      }
    }
  }, [outlet]);

  return <Outlet />;
}
