const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function req(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // Error handling: try JSON first, fallback to text
  if (!res.ok) {
    const ctErr = res.headers.get("content-type") || "";
    if (ctErr.includes("application/json")) {
      try {
        const data = await res.json();
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      } catch {
        // fall through to text
      }
    }
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  // DELETE often returns 204 No Content (empty body)
  if (res.status === 204) return null;

  // Only parse JSON if server says it's JSON
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;

  // Avoid "Unexpected end of JSON input" on empty body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const listPayments = () => req("/api/payments");

export const createPayment = (data) =>
  req("/api/payments", { method: "POST", body: JSON.stringify(data) });

export const updatePayment = (id, data) =>
  req(`/api/payments/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deletePayment = (id) =>
  req(`/api/payments/${id}`, { method: "DELETE" });
