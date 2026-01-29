// client/src/pages/Analytics/hooks/useAnalyticsPage.js
import { useEffect } from "react";
import { useAnalyticsState } from "./useAnalyticsState.js";
import { useAnalyticsLoad } from "./useAnalyticsLoad.js";
import { useAnalyticsActions } from "./useAnalyticsActions.js";
import { shortId } from "./analyticsFormat.js";

export function useAnalyticsPage() {
  const state = useAnalyticsState();
  const { loadAll } = useAnalyticsLoad(state);
  const actions = useAnalyticsActions(state, loadAll);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    ...actions,
    loadAll,
    shortId,
  };
}
