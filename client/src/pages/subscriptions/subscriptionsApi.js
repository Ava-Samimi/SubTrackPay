import { apiGet, apiFetch } from "../../api.js";

// Subscriptions CRUD
export const listSubscriptions = () => apiGet("/api/subscriptions");

export const createSubscription = (data) =>
  apiFetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const updateSubscription = (id, data) =>
  apiFetch(`/api/subscriptions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const deleteSubscription = (id) =>
  apiFetch(`/api/subscriptions/${id}`, {
    method: "DELETE",
  });

// Needed for autocomplete
export const listCustomers = () => apiGet("/api/customers");
export const listPackages = () => apiGet("/api/packages");
