import { useEffect } from "react";
import { useCustomersState } from "./useCustomersState.js";
import { useCustomersLoad } from "./useCustomersLoad.js";
import { useCustomersActions } from "./useCustomersActions.js";
import { fmtDate, fmtCcExp, shortId } from "./customersFormat.js";

export function useCustomersPage() {
  const state = useCustomersState();
  const { loadAll } = useCustomersLoad(state);
  const actions = useCustomersActions(state, loadAll);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    ...actions,
    loadAll,
    fmtDate,
    fmtCcExp,
    shortId,
  };
}
