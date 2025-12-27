const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function apiGet(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
