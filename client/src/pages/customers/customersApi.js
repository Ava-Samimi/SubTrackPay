const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export async function listCustomers() {
  return request("/api/customers");
}

export async function createCustomer(payload) {
  return request("/api/customers", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateCustomer(id, payload) {
  return request(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteCustomer(id) {
  return request(`/api/customers/${id}`, { method: "DELETE" });
}

// For "# of subs"
export async function listSubscriptions() {
  return request("/api/subscriptions");
}
