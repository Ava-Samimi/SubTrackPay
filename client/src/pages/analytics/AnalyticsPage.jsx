import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import "./AnalyticsPage.css";
import LogoutButton from "../../components/LogoutButton.jsx";

// ✅ Charts (each chart manages its own data internally)
import AnalyticsChart2 from "../../components/AnalyticsChart2.jsx";
import AnalyticsChart4 from "../../components/AnalyticsChart4.jsx";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export default function AnalyticsPage() {
  const location = useLocation();
  const isActiveRoute = (path) => location.pathname === path;

  // Load analytics definitions from API
  const [analyticsRows, setAnalyticsRows] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // Popup state
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [selectedAnalyticsName, setSelectedAnalyticsName] = useState("");
  const [selectedChartKey, setSelectedChartKey] = useState(null); // "chart2" | "chart4" | null

  useEffect(() => {
    setLoadingAnalytics(true);
    setAnalyticsError("");

    fetch(`${API}/api/analytics`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((rows) => {
        setAnalyticsRows(Array.isArray(rows) ? rows : []);
        setLoadingAnalytics(false);
      })
      .catch((err) => {
        console.error("Error fetching /api/analytics:", err);
        setAnalyticsError("Failed to load analytics list.");
        setLoadingAnalytics(false);
      });
  }, []);

  // Decide which chart to show based on the clicked name
  function pickChartForName(name) {
    const n = String(name || "").toLowerCase();

    // If it is top five packages -> AnalyticsChart2
    if (n.includes("top 5") || n.includes("top five") || n.includes("packages")) {
      return "chart2";
    }

    // If it is current geographical -> AnalyticsChart4
    if (n.includes("geographical") || n.includes("geographic")) {
      return "chart4";
    }

    return "chart2";
  }

  function openChartFor(row) {
    const name = row?.analyticsName || "Analytics";
    setSelectedAnalyticsName(name);
    setSelectedChartKey(pickChartForName(name));
    setShowChartPopup(true);
  }

  const ChartComponent = useMemo(() => {
    // Memoize the selected chart component to prevent unnecessary re-renders
    if (selectedChartKey === "chart4") return AnalyticsChart4;
    return AnalyticsChart2;
  }, [selectedChartKey]);

  return (
    <div className="analytics-page">
      <div className="analytics-layout">
        {/* LEFT: Sidebar (keep like before) */}
        <div className="analytics-left">
          <div className="analytics-left-title">Analytics</div>

          <div className="analytics-formcard">
            <div className="analytics-label">Tip</div>
            <div className="analytics-tip">
              Click an analysis in the list to open its chart in a popup.
            </div>
          </div>
        </div>

        {/* RIGHT: List like Customers page */}
        <div className="analytics-right">
          <div className="analytics-navbar">
            <div className="analytics-navgroup">
              <Link
                className={`analytics-navbtn ${
                  isActiveRoute("/customers") ? "analytics-navbtn-active" : ""
                }`}
                to="/customers"
              >
                Customers
              </Link>
              <Link
                className={`analytics-navbtn ${
                  isActiveRoute("/packages") ? "analytics-navbtn-active" : ""
                }`}
                to="/packages"
              >
                Packages
              </Link>
              <Link
                className={`analytics-navbtn ${
                  isActiveRoute("/subscriptions") ? "analytics-navbtn-active" : ""
                }`}
                to="/subscriptions"
              >
                Subscriptions
              </Link>
              <Link
                className={`analytics-navbtn ${
                  isActiveRoute("/payments") ? "analytics-navbtn-active" : ""
                }`}
                to="/payments"
              >
                Payments
              </Link>
              <Link
                className={`analytics-navbtn ${
                  isActiveRoute("/analytics") ? "analytics-navbtn-active" : ""
                }`}
                to="/analytics"
              >
                Analytics
              </Link>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <LogoutButton className="analytics-navbtn" />
            </div>
          </div>

          {/* CONTENT AREA (list) */}
          <div className="analytics-formcard" style={{ marginTop: 14 }}>
            {analyticsError ? <div className="analytics-error">{analyticsError}</div> : null}

            {loadingAnalytics ? (
              <div className="analytics-muted">Loading analytics...</div>
            ) : analyticsRows.length === 0 ? (
              <div className="analytics-muted">No analytics found.</div>
            ) : (
              <>
                {/* Header (same styling class, but 1 column) */}
                <div
                  className="analytics-header"
                  style={{ gridTemplateColumns: "1fr", minWidth: 0 }}
                >
                  <div>Analytics Name</div>
                </div>

                {/* Rows (same styling class, but 1 column) */}
                {analyticsRows.map((a) => (
                  <div
                    key={a.analyticsID}
                    className="analytics-row"
                    style={{ gridTemplateColumns: "1fr", minWidth: 0 }}
                    onClick={() => openChartFor(a)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openChartFor(a);
                    }}
                    title="Click to open chart"
                  >
                    <div style={{ fontWeight: 900 }}>{a.analyticsName}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* =========================
          POPUP / MODAL (Chart only)
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
            {/* Title centered above chart */}
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

            {/* Close button (hacker green) */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowChartPopup(false)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(57, 255, 20, 0.6)",
                  background: "#000",
                  color: "#39ff14",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {/* Chart centered */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 12,
                border: "1px solid rgba(57, 255, 20, 0.25)",
                padding: 10,
                background: "#000",
              }}
            >
              <div style={{ width: "100%", height: "100%" }}>
                <ChartComponent />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
