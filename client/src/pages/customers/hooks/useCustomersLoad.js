import { buildSubCounts } from "./customersFormat.js";
import { listCustomers, listSubscriptions } from "../customersApi.js";

export function useCustomersLoad(state) {
  const { setLoading, setError, setCustomers, setSubCounts } = state;

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [cust, subs] = await Promise.all([listCustomers(), listSubscriptions()]);
      setCustomers(cust);
      setSubCounts(buildSubCounts(subs));
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  return { loadAll };
}
