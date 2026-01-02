export function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function fmtCcExp(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  // For CC expiration, YYYY-MM is usually enough
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${yyyy}-${mm}`;
}

export function shortId(id) {
  return String(id || "").slice(0, 4);
}

export function buildSubCounts(subscriptions) {
  const counts = {};
  for (const s of subscriptions || []) {
    // new schema uses customerID (int)
    const key = s.customerID;
    if (key === undefined || key === null) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function normalizeCustomerPayload({ firstName, lastName, email, ccExpiration }) {
  if (!firstName || !String(firstName).trim()) {
    throw new Error("firstName is required");
  }
  if (!lastName || !String(lastName).trim()) {
    throw new Error("lastName is required");
  }

  // Accept blank => null. Accept ISO date string => send string (server will parse)
  const cc = ccExpiration && String(ccExpiration).trim() ? String(ccExpiration).trim() : null;

  return {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: email && String(email).trim() ? String(email).trim() : null,
    ccExpiration: cc,
  };
}
