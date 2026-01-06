// client/src/pages/payments/paymentsApi.js
import { apiGet, apiFetch } from "../../api.js";

export const listPayments = () => apiGet("/api/payments");

export const createPayment = (data) =>
  apiFetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const updatePayment = (id, data) =>
  apiFetch(`/api/payments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const deletePayment = (id) =>
  apiFetch(`/api/payments/${id}`, {
    method: "DELETE",
  });
