// client/src/components/NorthAmericaMapModal.jsx
import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { apiGet } from "../api.js";

export default function NorthAmericaMapModal({ open, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loadingPts, setLoadingPts] = useState(false);
  const [pointsErr, setPointsErr] = useState("");

  const [filters, setFilters] = useState({ ALL: true });

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function normalizeCustomers(json) {
    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.customers)
      ? json.customers
      : [];

    return rows
      .map((row) => {
        const lat = Number(row.latitude);
        const lon = Number(row.longitude);

        return {
          customerID: row.customerID ?? row.customerId ?? row.id,
          name:
            `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
            row.fullName ||
            row.name ||
            "Unnamed customer",
          email: row.email || "",
          postalCode: row.postalCode || "",
          lat,
          lon,
        };
      })
      .filter(
        (row) =>
          row.customerID != null &&
          Number.isFinite(row.lat) &&
          Number.isFinite(row.lon) &&
          row.lat >= 18 &&
          row.lat <= 73 &&
          row.lon >= -170 &&
          row.lon <= -52
      );
  }

  function normalizeSubscriptions(json) {
    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.subscriptions)
      ? json.subscriptions
      : [];

    return rows
      .map((row) => ({
        subscriptionID:
          row.subscriptionID ?? row.subscriptionId ?? row.id ?? null,
        customerID: row.customerID ?? row.customerId ?? row.customer_id ?? null,
        packageID: row.packageID ?? row.packageId ?? row.package_id ?? null,
        status: row.status || row.state || "",
        billingCycle: row.billingCycle || row.billing_cycle || row.cycle || "",
      }))
      .filter((row) => row.customerID != null && row.packageID != null);
  }

  function normalizePackages(json) {
    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.packages)
      ? json.packages
      : [];

    return rows
      .map((row) => ({
        packageID: row.packageID ?? row.packageId ?? row.id ?? null,
        name: row.name || row.title || row.packageName || "",
      }))
      .filter((row) => row.packageID != null && row.name);
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadAll() {
      setLoadingPts(true);
      setPointsErr("");

      try {
        const [customersJson, subscriptionsJson, packagesJson] = await Promise.all([
          apiGet("/api/customers"),
          apiGet("/api/subscriptions"),
          apiGet("/api/packages"),
        ]);

        if (cancelled) return;

        const normalizedCustomers = normalizeCustomers(customersJson);
        const normalizedSubscriptions = normalizeSubscriptions(subscriptionsJson);
        const normalizedPackages = normalizePackages(packagesJson);

        setCustomers(normalizedCustomers);
        setSubscriptions(normalizedSubscriptions);
        setPackages(normalizedPackages);

        setFilters((prev) => {
          const next = { ALL: prev.ALL ?? true };
          for (const pkg of normalizedPackages) {
            next[pkg.name] = prev[pkg.name] ?? false;
          }
          return next;
        });
      } catch (e) {
        if (!cancelled) {
          setCustomers([]);
          setSubscriptions([]);
          setPackages([]);
          setPointsErr(String(e?.message || e));
        }
      } finally {
        if (!cancelled) {
          setLoadingPts(false);
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filterButtons = useMemo(() => {
    const packageButtons = packages
      .map((p) => p.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return ["ALL", ...packageButtons];
  }, [packages]);

  const toggleFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev };

      if (key === "ALL") {
        const cleared = { ALL: true };
        for (const btn of filterButtons) {
          if (btn !== "ALL") cleared[btn] = false;
        }
        return cleared;
      }

      next[key] = !prev[key];
      next.ALL = false;

      return next;
    });
  };

  const packageIdToName = useMemo(() => {
    const map = new Map();
    for (const pkg of packages) {
      map.set(pkg.packageID, pkg.name);
    }
    return map;
  }, [packages]);

  const customerPackageNames = useMemo(() => {
    const map = new Map();

    for (const sub of subscriptions) {
      const pkgName = packageIdToName.get(sub.packageID);
      if (!pkgName) continue;

      if (!map.has(sub.customerID)) {
        map.set(sub.customerID, new Set());
      }
      map.get(sub.customerID).add(pkgName);
    }

    return map;
  }, [subscriptions, packageIdToName]);

  const allCustomerIDs = useMemo(() => {
    return new Set(customers.map((c) => c.customerID));
  }, [customers]);

  const anyNonAllToggleOn = useMemo(
    () =>
      Object.entries(filters).some(
        ([key, value]) => key !== "ALL" && Boolean(value)
      ),
    [filters]
  );

  const filteredCustomers = useMemo(() => {
    if (filters.ALL) {
      return customers.filter((customer) => allCustomerIDs.has(customer.customerID));
    }

    if (!anyNonAllToggleOn) return [];

    const selectedPackages = filterButtons.filter(
      (name) => name !== "ALL" && filters[name]
    );

    return customers.filter((customer) => {
      const customerPackages =
        customerPackageNames.get(customer.customerID) || new Set();

      return selectedPackages.some((pkg) => customerPackages.has(pkg));
    });
  }, [
    filters,
    anyNonAllToggleOn,
    filterButtons,
    customers,
    customerPackageNames,
    allCustomerIDs,
  ]);

  const lats = useMemo(
    () => filteredCustomers.map((p) => p.lat),
    [filteredCustomers]
  );
  const lons = useMemo(
    () => filteredCustomers.map((p) => p.lon),
    [filteredCustomers]
  );

  const hoverTexts = useMemo(
    () =>
      filteredCustomers.map((p) => {
        const pkgSet = customerPackageNames.get(p.customerID) || new Set();
        const pkgText = Array.from(pkgSet).sort().join(", ") || "None";

        return (
          `<b>${p.name}</b><br>` +
          `Email: ${p.email || "N/A"}<br>` +
          `Postal Code: ${p.postalCode || "N/A"}<br>` +
          `Packages: ${pkgText}<br>` +
          `Lat: ${p.lat.toFixed(4)}<br>` +
          `Lon: ${p.lon.toFixed(4)}`
        );
      }),
    [filteredCustomers, customerPackageNames]
  );

  if (!open) return null;

  const HACKER_GREEN = "#00ff66";
  const LAND_BLACK = "#000000";
  const BORDER = "rgba(0,255,102,0.35)";

  const baseTrace = {
    type: "scattergeo",
    mode: "markers",
    lat: [39],
    lon: [-98],
    hoverinfo: "skip",
    marker: {
      size: 1,
      color: "rgba(0,0,0,0)",
      line: { width: 0 },
    },
    showlegend: false,
    name: "",
  };

  const glowTrace = {
    type: "scattergeo",
    mode: "markers",
    lat: lats,
    lon: lons,
    text: hoverTexts,
    hoverinfo: "skip",
    marker: {
      size: 8,
      color: "rgba(255,0,0,0.18)",
      line: { width: 0 },
    },
    showlegend: false,
    name: "",
  };

  const dotTrace = {
    type: "scattergeo",
    mode: "markers",
    lat: lats,
    lon: lons,
    text: hoverTexts,
    marker: {
      size: 3,
      color: "rgba(255,0,0,1)",
      line: { width: 0 },
    },
    hovertemplate: "%{text}<extra></extra>",
    showlegend: false,
    name: "",
  };

  const plotData =
    filters.ALL || anyNonAllToggleOn
      ? [baseTrace, glowTrace, dotTrace]
      : [baseTrace];

  return (
    <div style={styles.backdrop} onMouseDown={() => onClose?.()}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Our Clients (USA + Canada, incl. Alaska)</h2>
          <button
            onClick={() => onClose?.()}
            style={styles.xBtn}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p style={styles.subtext}>
          Customer locations filtered by package toggles.
        </p>

        {pointsErr && (
          <div style={{ marginBottom: 12, color: "#ff6b6b" }}>
            Map data error: {pointsErr}
          </div>
        )}

        <div style={styles.mapRow}>
          <div style={styles.mapBox}>
            <Plot
              data={plotData}
              layout={{
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(0,0,0,0)",
                margin: { l: 0, r: 0, t: 0, b: 0 },
                showlegend: false,
                dragmode: false,
                geo: {
                  scope: "north america",
                  projection: { type: "mercator" },
                  lataxis: { range: [18, 73] },
                  lonaxis: { range: [-170, -52] },
                  showocean: true,
                  oceancolor: HACKER_GREEN,
                  showland: true,
                  landcolor: LAND_BLACK,
                  showcountries: true,
                  countrycolor: BORDER,
                  showlakes: true,
                  lakecolor: HACKER_GREEN,
                  showcoastlines: true,
                  coastlinecolor: BORDER,
                  showsubunits: true,
                  subunitcolor: BORDER,
                  bgcolor: "rgba(0,0,0,0)",
                },
              }}
              config={{
                displayModeBar: false,
                responsive: true,
                staticPlot: true,
                scrollZoom: false,
                doubleClick: false,
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
            />
          </div>

          <div style={styles.sidePanel}>
            <div style={styles.sideTitle}>Packages</div>

            <div style={styles.filterViewport}>
              <div style={styles.filterButtonGrid}>
                {filterButtons.map((label) => {
                  const isOn = !!filters[label];

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleFilter(label)}
                      style={{
                        ...styles.filterToggleBtn,
                        ...(isOn
                          ? styles.filterToggleBtnOn
                          : styles.filterToggleBtnOff),
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.status}>
              {loadingPts && <div>Loading...</div>}

              {!loadingPts && !pointsErr && (
                <>
                  <div>
                    Customers Loaded: <b>{customers.length}</b>
                  </div>
                  <div>
                    Customers Plotted: <b>{filteredCustomers.length}</b>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={() => onClose?.()} style={styles.btnSecondary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    width: "min(980px, 100%)",
    maxHeight: "min(860px, 92vh)",
    background: "#0f1115",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "white",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  subtext: {
    marginTop: 10,
    marginBottom: 12,
    opacity: 0.85,
  },
  mapRow: {
    display: "flex",
    gap: 14,
    alignItems: "stretch",
  },
  mapBox: {
    flex: "0 0 640px",
    height: 440,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.6)",
  },
  sidePanel: {
    flex: "0 0 260px",
    width: 260,
    height: 440,
    borderRadius: 12,
    padding: 12,
    background: "rgba(0,0,0,0.65)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sideTitle: {
    fontWeight: 700,
    marginBottom: 10,
    color: "#00ff66",
    flex: "0 0 auto",
  },
  filterViewport: {
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: 4,
    marginBottom: 12,
  },
  filterButtonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },
  filterToggleBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,255,102,0.35)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "left",
  },
  filterToggleBtnOff: {
    background: "#000000",
    color: "#ffffff",
  },
  filterToggleBtnOn: {
    background: "#00ff66",
    color: "#000000",
    border: "1px solid #00ff66",
    boxShadow: "0 0 10px rgba(0,255,102,0.25)",
  },
  status: {
    flex: "0 0 auto",
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  btnSecondary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};