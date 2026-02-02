const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function fetchActiveSubscriptionsSnapshot(basis = "monthly") {
  const res = await fetch(
    `${API}/api/metrics/active-subscriptions?basis=${encodeURIComponent(basis)}&years=10`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Unknown error");
  return json.rows;
}

export async function fetchActiveCustomersSnapshot(basis = "monthly") {
  const res = await fetch(
    `${API}/api/metrics/active-customers?basis=${encodeURIComponent(basis)}&years=10`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Unknown error");
  return json.rows;
}

export async function fetchActivePackagesSnapshot(basis = "monthly") {
  const res = await fetch(
    `${API}/api/metrics/active-packages?basis=${encodeURIComponent(basis)}&years=10`
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Unknown error");

  return json.rows;
}

export async function fetchAvgAmountPaidAssumed(basis = "monthly", years = 10) {
  const res = await fetch(
    `${API}/api/metrics/avg-amount-paid?basis=${encodeURIComponent(basis)}&years=${encodeURIComponent(
      String(years)
    )}`
  );

  const text = await res.text(); // read body once
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave json null
  }

  if (!res.ok) {
    const msg = json?.error || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!json?.ok) throw new Error(json?.error || "Unknown error");
  return json.rows;
}

// Active Subscriptions by Package (NOW) — no basis, no years
export async function fetchActiveSubscriptionsByPackageSnapshot() {
  const res = await fetch(`${API}/api/metrics/active-subscriptions-by-package`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Unknown error");

  return json.rows;
}
