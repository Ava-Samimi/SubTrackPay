// client/src/components/NorthAmericaMapModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function sampleCandidatePoint() {
  const lat = randBetween(18, 72);
  const lon = randBetween(-170, -52);
  return { lat, lon };
}

async function fetchGeoJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load ${url} (HTTP ${resp.status})`);
  return resp.json();
}

function featureToGeometry(geojson) {
  if (!geojson) throw new Error("Empty GeoJSON");

  if (geojson.type === "FeatureCollection") {
    if (!geojson.features?.length) throw new Error("Empty FeatureCollection");
    geojson = geojson.features[0];
  }

  if (geojson.type === "Feature") {
    if (!geojson.geometry) throw new Error("Feature has no geometry");
    return geojson.geometry;
  }

  if (geojson.type === "Polygon" || geojson.type === "MultiPolygon") return geojson;

  throw new Error(`Unsupported GeoJSON type: ${geojson.type}`);
}

function pointInAnyPolygon(pt, geometries) {
  const p = turfPoint([pt.lon, pt.lat]);
  for (const geom of geometries) {
    if (booleanPointInPolygon(p, geom)) return true;
  }
  return false;
}

export default function NorthAmericaMapModal({ open, onClose }) {
  const [showDots, setShowDots] = useState(true);
  const [showGlow, setShowGlow] = useState(true);
  const [showBorders, setShowBorders] = useState(true);

  const [landGeoms, setLandGeoms] = useState(null);
  const [loadingLand, setLoadingLand] = useState(false);
  const [landErr, setLandErr] = useState("");

  const [points, setPoints] = useState([]);
  const [loadingPts, setLoadingPts] = useState(false);

  const lats = useMemo(() => points.map((p) => p.lat), [points]);
  const lons = useMemo(() => points.map((p) => p.lon), [points]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLandErr("");
      setLoadingLand(true);
      try {
        const [usa, can] = await Promise.all([
          fetchGeoJSON("/geo/usa.geo.json"),
          fetchGeoJSON("/geo/can.geo.json"),
        ]);

        const usaGeom = featureToGeometry(usa);
        const canGeom = featureToGeometry(can);

        if (!cancelled) setLandGeoms([usaGeom, canGeom]);
      } catch (e) {
        if (!cancelled) {
          setLandErr(String(e?.message || e));
          setLandGeoms(null);
        }
      } finally {
        if (!cancelled) setLoadingLand(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const generateLandPoints = async () => {
    if (!landGeoms?.length) return;

    setLoadingPts(true);
    try {
      const out = [];
      let guard = 0;

      while (out.length < 100 && guard < 600000) {
        guard++;
        const cand = sampleCandidatePoint();
        if (pointInAnyPolygon(cand, landGeoms)) out.push(cand);
      }

      setPoints(out);
    } finally {
      setLoadingPts(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!landGeoms?.length) return;
    generateLandPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, landGeoms]);

  if (!open) return null;

  const HACKER_GREEN = "#00ff66";
  const LAND_BLACK = "#000000";
  const BORDER = "rgba(0,255,102,0.35)";

  const glowTrace = {
    type: "scattergeo",
    mode: "markers",
    lat: lats,
    lon: lons,
    marker: { size: 10, color: "rgba(255, 0, 0, 0.25)", line: { width: 0 } },
    hoverinfo: "skip",
    showlegend: false,
    name: "",
  };

  const dotTrace = {
    type: "scattergeo",
    mode: "markers",
    lat: lats,
    lon: lons,
    marker: { size: 4, color: "rgba(255, 30, 30, 1)", line: { width: 0 } },
    hovertemplate: "Lat: %{lat:.4f}<br>Lon: %{lon:.4f}<extra></extra>",
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
          <button onClick={() => onClose?.()} style={styles.xBtn} aria-label="Close">
            ✕
          </button>
        </div>

        <p style={styles.subtext}>
          Land-only points using Turf point-in-polygon (no ocean dots). Alaska included.
        </p>

        {landErr && (
          <div style={{ marginBottom: 12, color: "#ff6b6b" }}>
            GeoJSON error: {landErr}
          </div>
        )}

        {/* ✅ Map + right-side controls layout */}
        <div style={styles.mapRow}>
          {/* ✅ Smaller map */}
          <div style={styles.mapBox}>
            <Plot
              data={plotData}
              layout={{
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(0,0,0,0)",
                margin: { l: 0, r: 0, t: 0, b: 0 },
                showlegend: false, // ✅ no “trace” stuff

                // ✅ non-draggable
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

                // ✅ keep it static (no pan/zoom)
                staticPlot: true,
                scrollZoom: false,
                doubleClick: false,
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
            />
          </div>

          {/* ✅ Controls in black space to the right */}
          <div style={styles.sidePanel}>
            <div style={styles.sideTitle}>Controls</div>

            <div style={styles.overlayButtons}>
              <button style={styles.overlayBtn} onClick={() => {}} disabled={loadingLand || loadingPts}>
                Action 1
              </button>
              <button style={styles.overlayBtn} onClick={() => {}} disabled={loadingLand || loadingPts}>
                Action 2
              </button>
              <button style={styles.overlayBtn} onClick={() => {}} disabled={loadingLand || loadingPts}>
                Action 3
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
              {loadingLand && <div>Loading land polygons…</div>}
              {!loadingLand && !landErr && landGeoms && (
                <div style={{ opacity: 0.9 }}>
                  Points: <b>{points.length}</b>/100
                </div>
              )}
              {loadingPts && <div>Generating points…</div>}
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
  header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  xBtn: { background: "transparent", border: "none", color: "white", fontSize: 18, cursor: "pointer" },
  subtext: { marginTop: 10, marginBottom: 12, opacity: 0.85 },

  // ✅ row that contains the map + right panel
  mapRow: {
    display: "flex",
    gap: 14,
    alignItems: "stretch",
  },

  // ✅ smaller map
  mapBox: {
    flex: "0 0 640px",         // map width
    height: 440,               // map height (smaller)
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.6)",
  },

  // ✅ black area on the right
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

  checkRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.95 },
  checkText: { lineHeight: 1.2 },

  status: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 10,
    fontSize: 12,
    opacity: 0.9,
    marginTop: "auto",
  },

  footer: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  btnSecondary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};
