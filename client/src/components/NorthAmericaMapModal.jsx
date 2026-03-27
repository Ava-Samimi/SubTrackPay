// client/src/components/NorthAmericaMapModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

export default function NorthAmericaMapModal({ open, onClose }) {
  const [showDots, setShowDots] = useState(true);
  const [showGlow, setShowGlow] = useState(true);
  const [showBorders, setShowBorders] = useState(true);

  const [points, setPoints] = useState([]);
  const [loadingPts, setLoadingPts] = useState(false);
  const [pointsErr, setPointsErr] = useState("");

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const normalizeRows = (json) => {
    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.customers)
      ? json.customers
      : [];

    return rows
      .map((row) => ({
        id: row.customerID,
        name:
          `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
          "Unnamed customer",
        email: row.email || "",
        postalCode: row.postalCode || "",
        lat: Number(row.latitude),
        lon: Number(row.longitude),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.lat) &&
          Number.isFinite(row.lon) &&
          row.lat >= 18 &&
          row.lat <= 73 &&
          row.lon >= -170 &&
          row.lon <= -52
      );
  };

  const loadCustomerPoints = async () => {
    setLoadingPts(true);
    setPointsErr("");

    try {
      const resp = await fetch(`${API_BASE}/api/customers`);
      if (!resp.ok) {
        throw new Error(`Failed to load customers (HTTP ${resp.status})`);
      }

      const json = await resp.json();
      const cleaned = normalizeRows(json);
      setPoints(cleaned);
    } catch (e) {
      setPoints([]);
      setPointsErr(String(e?.message || e));
    } finally {
      setLoadingPts(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoadingPts(true);
      setPointsErr("");

      try {
        const resp = await fetch(`${API_BASE}/api/customers`);
        if (!resp.ok) {
          throw new Error(`Failed to load customers (HTTP ${resp.status})`);
        }

        const json = await resp.json();
        const cleaned = normalizeRows(json);

        if (!cancelled) {
          setPoints(cleaned);
        }
      } catch (e) {
        if (!cancelled) {
          setPoints([]);
          setPointsErr(String(e?.message || e));
        }
      } finally {
        if (!cancelled) {
          setLoadingPts(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [open, API_BASE]);

  const lats = useMemo(() => points.map((p) => p.lat), [points]);
  const lons = useMemo(() => points.map((p) => p.lon), [points]);

  const hoverTexts = useMemo(
    () =>
      points.map(
        (p) =>
          `<b>${p.name}</b><br>` +
          `Email: ${p.email || "N/A"}<br>` +
          `Postal Code: ${p.postalCode || "N/A"}<br>` +
          `Lat: ${p.lat.toFixed(4)}<br>` +
          `Lon: ${p.lon.toFixed(4)}`
      ),
    [points]
  );

  if (!open) return null;

  const HACKER_GREEN = "#00ff66";
  const LAND_BLACK = "#000000";
  const BORDER = "rgba(0,255,102,0.35)";

  const glowTrace = {
    type: "scattergeo",
    mode: "markers",
    lat: lats,
    lon: lons,
    text: hoverTexts,
    hoverinfo: "skip",
    marker: {
      size: 8,
      color: "rgba(255, 0, 0, 0.18)",
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
      color: "rgba(255, 40, 40, 1)",
      line: { width: 0 },
    },
    hovertemplate: "%{text}<extra></extra>",
    showlegend: false,
    name: "",
  };

  const plotData = [];
  if (showGlow && showDots) plotData.push(glowTrace);
  if (showDots) plotData.push(dotTrace);

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
          Customer locations loaded from database latitude/longitude values
          linked to postal codes.
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
                  countrycolor: showBorders ? BORDER : "rgba(0,0,0,0)",

                  showlakes: true,
                  lakecolor: HACKER_GREEN,

                  showcoastlines: true,
                  coastlinecolor: showBorders ? BORDER : "rgba(0,0,0,0)",

                  showsubunits: true,
                  subunitcolor: showBorders ? BORDER : "rgba(0,0,0,0)",

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
            <div style={styles.sideTitle}>Controls</div>

            <div style={styles.overlayButtons}>
              <button
                style={styles.overlayBtn}
                onClick={() => setShowDots(true)}
                disabled={loadingPts}
              >
                Show All Dots
              </button>

              <button
                style={styles.overlayBtn}
                onClick={() => setShowGlow((v) => !v)}
                disabled={loadingPts || !showDots}
              >
                Toggle Glow
              </button>

              <button
                style={styles.overlayBtn}
                onClick={loadCustomerPoints}
                disabled={loadingPts}
              >
                Refresh Data
              </button>
            </div>

            <div style={styles.overlayChecks}>
              <label style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={showDots}
                  onChange={(e) => setShowDots(e.target.checked)}
                />
                <span style={styles.checkText}>Show dots</span>
              </label>

              <label style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={showGlow}
                  disabled={!showDots}
                  onChange={(e) => setShowGlow(e.target.checked)}
                />
                <span style={styles.checkText}>Glow</span>
              </label>

              <label style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={showBorders}
                  onChange={(e) => setShowBorders(e.target.checked)}
                />
                <span style={styles.checkText}>Borders</span>
              </label>
            </div>

            <div style={styles.status}>
              {loadingPts && <div>Loading customer map points…</div>}
              {!loadingPts && !pointsErr && (
                <div style={{ opacity: 0.9 }}>
                  Customers plotted: <b>{points.length}</b>
                </div>
              )}
              {!loadingPts && !pointsErr && points.length === 0 && (
                <div style={{ opacity: 0.8 }}>
                  No customer coordinates were returned.
                </div>
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
    flex: "1 1 auto",
    minWidth: 220,
    borderRadius: 12,
    padding: 12,
    background: "rgba(0,0,0,0.65)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sideTitle: {
    fontSize: 13,
    opacity: 0.9,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 8,
  },
  overlayButtons: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  overlayBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,255,102,0.35)",
    background: "rgba(0,0,0,0.65)",
    color: "white",
    cursor: "pointer",
    fontSize: 13,
    opacity: 0.95,
  },
  overlayChecks: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 10,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    opacity: 0.95,
  },
  checkText: {
    lineHeight: 1.2,
  },
  status: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 10,
    fontSize: 12,
    opacity: 0.9,
    marginTop: "auto",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
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