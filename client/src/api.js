import { auth } from "./firebase";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function parseError(res) {
  const text = await res.text().catch(() => "");
  try {
    const j = JSON.parse(text);
    return j?.error || j?.message || text || `Request failed (${res.status})`;
  } catch {
    return text || `Request failed (${res.status})`;
  }
}

export async function apiGet(path) {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${API}${path}`, {
    headers: { ...authHeader },
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiFetch(path, options = {}) {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeader,
    },
  });

  if (!res.ok) throw new Error(await parseError(res));

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;

  return res.json();
}
