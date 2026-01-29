// client/src/pages/Analytics/hooks/useAnalyticsLoad.js
import { listAnalytics } from "../analyticsApi.js";

export function useAnalyticsLoad(state) {
  const { setLoading, setError, setAnalytics } = state;

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const rows = await listAnalytics();
      const analytics = Array.isArray(rows) ? rows : [];
      setAnalytics(analytics);
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  return { loadAll };
}
