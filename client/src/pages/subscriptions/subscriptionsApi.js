// client/src/api/subscriptionsApi.js
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function req(path, options = {}) {
  const url = `${API}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // Try to return something useful from server errors
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }

  // Some endpoints (DELETE) might return 204 No Content
  if (res.status === 204) return null;

  // If server returns non-JSON, fall back gracefully
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const txt = await res.text().catch(() => "");
  return txt || null;
}

// Subscriptions CRUD
export const listSubscriptions = () => req("/api/subscriptions");

export const createSubscription = (data) =>
  req("/api/subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateSubscription = (id, data) =>
  req(`/api/subscriptions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteSubscription = (id) =>
  req(`/api/subscriptions/${id}`, {
    method: "DELETE",
  });

// Needed for autocomplete
export const listCustomers = () => req("/api/customers");
export const listPackages = () => req("/api/packages");
