const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function req(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

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

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const listPackages = () => req("/api/packages");

export const createPackage = (data) =>
  req("/api/packages", { method: "POST", body: JSON.stringify(data) });

export const updatePackage = (id, data) =>
  req(`/api/packages/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deletePackage = (id) =>
  req(`/api/packages/${id}`, { method: "DELETE" });
