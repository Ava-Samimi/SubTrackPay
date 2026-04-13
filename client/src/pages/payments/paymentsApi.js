// client/src/pages/payments/paymentsApi.js
import { apiGet, apiFetch } from "../../api.js";

function normId(id) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : id;
}

// Payments CRUD
export const listPayments = () =>
  // Request nested relations for subscription, customer, and package.
  apiGet("/api/payments?include=1");

export const createPayment = (payload) =>
  apiFetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updatePayment = (id, payload) =>
  apiFetch(`/api/payments/${normId(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deletePayment = (id) =>
  apiFetch(`/api/payments/${normId(id)}`, {
    method: "DELETE",
  });
