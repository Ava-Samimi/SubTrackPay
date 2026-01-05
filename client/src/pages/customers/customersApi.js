import { apiGet, apiFetch } from "../../api.js";

export async function listCustomers() {
  return apiGet("/api/customers");
}

export async function createCustomer(payload) {
  return apiFetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(id, payload) {
  return apiFetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomer(id) {
  return apiFetch(`/api/customers/${id}`, {
    method: "DELETE",
  });
}

// For "# of subs"
export async function listSubscriptions() {
  return apiGet("/api/subscriptions");
}
