// client/src/pages/subscriptions/subscriptionsApi.js
import { apiGet, apiFetch } from "../../api.js";

function normId(id) {
  // prefer numbers, but keep fallback to original string
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : id;
}

// Subscriptions CRUD
export const listSubscriptions = () =>
  // If your backend supports include, this ensures s.customer and s.package are present.
  // If it doesn't, it will simply ignore the querystring.
  apiGet("/api/subscriptions?include=1");

export const createSubscription = (payload) =>
  apiFetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateSubscription = (id, payload) =>
  apiFetch(`/api/subscriptions/${normId(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteSubscription = (id) =>
  apiFetch(`/api/subscriptions/${normId(id)}`, {
    method: "DELETE",
  });

// Needed for autocomplete
export const listCustomers = () => apiGet("/api/customers");
export const listPackages = () => apiGet("/api/packages");
