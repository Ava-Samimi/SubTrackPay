export function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function shortId(id) {
  return String(id || "").slice(0, 4);
}

export function buildSubCounts(subscriptions) {
  const counts = {};
  for (const s of subscriptions || []) {
    counts[s.customerId] = (counts[s.customerId] || 0) + 1;
  }
  return counts;
}

export function normalizeCustomerPayload({ name, email, phone }) {
  if (!name || !String(name).trim()) {
    throw new Error("name is required");
  }
  return {
    name: String(name).trim(),
    email: email ? String(email).trim() : null,
    phone: phone ? String(phone).trim() : null,
  };
}
