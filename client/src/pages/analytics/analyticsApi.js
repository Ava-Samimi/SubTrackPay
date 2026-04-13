// client/src/pages/AnalyticsPage/analyticsApi.js
import { apiGet, apiFetch } from "../../api.js";

export async function listAnalytics() {
  return apiGet("/api/analytics");
}

export async function createAnalytics(payload) {
  return apiFetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAnalytics(analysisID, payload) {
  return apiFetch(`/api/analytics/${analysisID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAnalytics(analysisID) {
  return apiFetch(`/api/analytics/${analysisID}`, {
    method: "DELETE",
  });
}
