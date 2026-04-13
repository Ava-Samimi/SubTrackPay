import { buildSubCounts } from "./customersFormat.js";
import { listCustomers, listSubscriptions } from "../customersApi.js";

export function useCustomersLoad(state) {
  const { setLoading, setError, setCustomers, setSubCounts } = state;

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [cust, subs] = await Promise.all([listCustomers(), listSubscriptions()]);
      const customers = Array.isArray(cust) ? cust : [];
      const subscriptions = Array.isArray(subs) ? subs : [];

      setCustomers(customers);
      setSubCounts(buildSubCounts(subscriptions));
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  return { loadAll };
}
