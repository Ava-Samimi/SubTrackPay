// client/src/pages/AnalyticsPage/AnalyticsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";

import "../shared/EntityPage.css"; // ✅ match other pages styling
import "./AnalyticsPage.css";
import LogoutButton from "../../components/LogoutButton.jsx";

import EntityNavBar from "../../components/EntityNavBar.jsx";
import EntityLeftHeader from "../../components/EntityLeftHeader.jsx";

// Left-side helper component (metric + basis + show)
import AnalyticsLeftShow from "../../components/AnalyticsLeftShow.jsx";

// handler factory (builds Plotly spec + opens popup)
import { createHandleShowClick } from "../../components/createHandleShowClick.js";

// Client fetch function(s)
import {
  fetchActiveSubscriptionsSnapshot,
  fetchActiveCustomersSnapshot,
  fetchActivePackagesSnapshot,
  fetchAvgAmountPaidAssumed,
  fetchActiveSubscriptionsByPackageSnapshot,
} from "../../api/metrics.js";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export default function AnalyticsPage() {
  // Plot ref (used to reliably get the Plotly DOM node for toImage)
  const plotRef = useRef(null);

  // Synchronous guard against duplicate saves (onAfterPlot fires multiple times)
  const savedKeysRef = useRef(new Set());

  // Popup state
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [selectedAnalyticsName, setSelectedAnalyticsName] = useState("");

  // popup mode + data for "Show" action
  const [popupMode, setPopupMode] = useState("plot"); // "rows" | "plot"
  const [snapshotRows, setSnapshotRows] = useState([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState("");

  // Plotly spec for "Show" action
  const [popupPlot, setPopupPlot] = useState(null);

  // Optional: keep for debug/UI; main protection is savedKeysRef
  const [savedOnceKey, setSavedOnceKey] = useState("");

  // Gallery state
  const [pngFiles, setPngFiles] = useState([]);
  const [pngLoading, setPngLoading] = useState(true);
  const [pngError, setPngError] = useState("");

  async function loadPngGallery() {
    try {
      setPngLoading(true);
      setPngError("");

      const res = await fetch(`${API}/api/metrics/chart-pngs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load PNG list.");

      setPngFiles(Array.isArray(json.files) ? json.files : []);
      setPngLoading(false);
    } catch (e) {
      console.error("Failed to load chart pngs:", e);
      setPngError(e?.message || "Failed to load PNG gallery.");
      setPngLoading(false);
    }
  }

  useEffect(() => {
    loadPngGallery();
  }, []);

  // Show button handler (builds Plotly spec + opens popup)
  const handleShowClick = useMemo(() => {
    return createHandleShowClick({
      fetchActiveSubscriptionsSnapshot,
      fetchActiveCustomersSnapshot,
      fetchActivePackagesSnapshot,
      fetchAvgAmountPaidAssumed,
      fetchActiveSubscriptionsByPackageSnapshot,

      setSnapshotLoading,
      setSnapshotError,
      setSnapshotRows,

      setSelectedAnalyticsName,
      setPopupMode,
      setShowChartPopup,

      setPopupPlot,
    });
  }, [
    fetchActiveSubscriptionsSnapshot,
    fetchActiveCustomersSnapshot,
    fetchActivePackagesSnapshot,
    fetchAvgAmountPaidAssumed,
    fetchActiveSubscriptionsByPackageSnapshot,
    setSnapshotLoading,
    setSnapshotError,
    setSnapshotRows,
    setSelectedAnalyticsName,
    setPopupMode,
    setShowChartPopup,
    setPopupPlot,
  ]);

  // Reset save guards on every Show click, and refresh gallery shortly after
  const handleShowClickWithSaveReset = useMemo(() => {
    return async (payload) => {
      setSavedOnceKey("");
      savedKeysRef.current.clear();

      await handleShowClick(payload);

      // After popup opens & save happens, refresh gallery a moment later
      setTimeout(() => loadPngGallery(), 800);
    };
  }, [handleShowClick]);

  // helper to render rows nicely (used for error fallback)
  function renderRowsTable(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return <div className="entity-muted">No rows.</div>;
    }
    const cols = Object.keys(rows[0] || {});
    if (cols.length === 0) return <div className="entity-muted">No columns.</div>;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          borderRadius: 12,
          border: "1px solid rgba(57, 255, 20, 0.25)",
          background: "#000",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#000",
                    color: "#39ff14",
                    textAlign: "left",
                    padding: "10px 12px",
                    fontWeight: 900,
                    borderBottom: "1px solid rgba(57, 255, 20, 0.25)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td
                    key={c}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid rgba(57, 255, 20, 0.12)",
                      color: "rgba(57, 255, 20, 0.9)",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {String(r?.[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const listMode = true;
  const listButtonEnabled = false;

  return (
    <div className="entity-page">
      <div className="entity-layout">
        {/* LEFT */}
        <div className="entity-left">
          <EntityLeftHeader title="Analytics" logoSrc="/logo.png" />

          <AnalyticsLeftShow onShow={handleShowClickWithSaveReset} />

          <div className="entity-card" style={{ marginTop: 14 }}>
            <div className="entity-label">Gallery</div>

            <button type="button" className="entity-btn" onClick={loadPngGallery}>
              Refresh PNGs
            </button>

            {pngLoading ? (
              <div className="entity-muted" style={{ marginTop: 10 }}>
                Loading PNGs…
              </div>
            ) : pngError ? (
              <div className="entity-error" style={{ marginTop: 10 }}>
                {pngError}
              </div>
            ) : (
              <div className="entity-muted" style={{ marginTop: 10 }}>
                {pngFiles.length} image(s)
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="entity-right">
          <EntityNavBar
            listMode={listMode}
            listButtonEnabled={listButtonEnabled}
            onToggleListMode={() => {}}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <LogoutButton className="entity-btn" />
          </div>

          <div className="entity-card" style={{ marginTop: 14 }}>
            <div className="entity-label">Saved Charts</div>

            {pngLoading ? (
              <div className="entity-muted">Loading PNGs…</div>
            ) : pngError ? (
              <div className="entity-error">{pngError}</div>
            ) : pngFiles.length === 0 ? (
              <div className="entity-muted">No PNGs yet. Click Show to generate one.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  marginTop: 12,
                }}
              >
                {pngFiles.map((f) => (
                  <div
                    key={f.name}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(57, 255, 20, 0.25)",
                      background: "#000",
                      padding: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        color: "#39ff14",
                        fontWeight: 900,
                        fontSize: 12,
                        marginBottom: 8,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={f.name}
                    >
                      {f.name}
                    </div>

                    <img
                      src={`${API}${f.url}`}
                      alt={f.name}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 10,
                        display: "block",
                        border: "1px solid rgba(57, 255, 20, 0.15)",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(`${API}${f.url}`, "_blank")}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================
          POPUP / MODAL
         ========================= */}
      {showChartPopup && (
        <div
          role="presentation"
          onClick={() => setShowChartPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1100px, 95vw)",
              height: "min(750px, 90vh)",
              background: "#000",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              border: "1px solid rgba(57, 255, 20, 0.35)",
            }}
          >
            {/* Title */}
            <div
              style={{
                textAlign: "center",
                fontWeight: 900,
                fontSize: 20,
                color: "#39ff14",
                marginTop: 4,
              }}
            >
              {selectedAnalyticsName}
            </div>

            {/* Close button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="entity-btn" onClick={() => setShowChartPopup(false)}>
                Close
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 12,
                border: "1px solid rgba(57, 255, 20, 0.25)",
                padding: 10,
                background: "#000",
              }}
            >
              <div style={{ width: "100%", height: "100%" }}>
                {popupMode === "plot" ? (
                  popupPlot ? (
                    <Plot
                      ref={plotRef}
                      data={popupPlot.data}
                      layout={popupPlot.layout}
                      config={popupPlot.config}
                      useResizeHandler
                      style={{ width: "100%", height: "100%" }}
                      onAfterPlot={async () => {
                        try {
                          const gd = plotRef.current?.el;
                          if (!gd) return;

                          const xLen = popupPlot?.data?.[0]?.x?.length || 0;
                          const yLen = popupPlot?.data?.[0]?.y?.length || 0;
                          const key = `${selectedAnalyticsName}__${xLen}x${yLen}`;

                          // dedupe: prevents double-save on rapid double-calls
                          if (savedKeysRef.current.has(key)) return;
                          savedKeysRef.current.add(key);
                          if (savedOnceKey !== key) setSavedOnceKey(key);

                          const dataUrl = await Plotly.toImage(gd, {
                            format: "png",
                            width: 1200,
                            height: 700,
                            scale: 2,
                          });

                          const res = await fetch(`${API}/api/metrics/save-chart-png`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: selectedAnalyticsName,
                              filenameHint: selectedAnalyticsName,
                              pngDataUrl: dataUrl,
                            }),
                          });

                          if (!res.ok) {
                            const txt = await res.text();
                            throw new Error(`save png failed: HTTP ${res.status} ${txt}`);
                          }

                          loadPngGallery();
                        } catch (e) {
                          console.error("PNG save failed:", e);
                        }
                      }}
                    />
                  ) : (
                    <div className="entity-muted">No plot data.</div>
                  )
                ) : snapshotLoading ? (
                  <div className="entity-muted">Loading…</div>
                ) : snapshotError ? (
                  <div className="entity-error">{snapshotError}</div>
                ) : (
                  renderRowsTable(snapshotRows)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
