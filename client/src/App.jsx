// client/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import AuthGate from "./AuthGate.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";

import CustomersPage from "./pages/customers/CustomersPage.jsx";
import PackagesPage from "./pages/packages/PackagesPage.jsx";
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage.jsx";
import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import AnalyticsPage from "./pages/analytics/AnalyticsPage.jsx";

import SeedConfigModal from "./components/SeedConfigModal.jsx";

export default function App() {
  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // "first" => initial seed (no reset)
  // "reseed" => wipe + seed from scratch
  const [seedMode, setSeedMode] = useState("first");

  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
    []
  );

  // ✅ show modal only the first time this browser visits (until seeded once)
  useEffect(() => {
    const has = localStorage.getItem("seedConfig.v1");
    if (!has) {
      setSeedMode("first");
      setSeedOpen(true);
    }
  }, []);

  const handleSeedApply = async (cfg) => {
    setSeeding(true);
    try {
      const payload = {
        ...cfg,
        // ✅ on reseed we wipe DB first (API + seeder must support SEED_RESET)
        reset: seedMode === "reseed",
      };

      const resp = await fetch(`${API_BASE}/api/admin/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await resp.json().catch(() => ({}));

      if (!resp.ok || !json.ok) {
        console.error("Seed failed:", json);
        const msg =
          json?.err ||
          json?.error ||
          json?.output ||
          json?.out ||
          json?.message ||
          `Unknown error (HTTP ${resp.status}). Check browser console + API logs.`;
        alert("Seeding failed:\n\n" + msg);
        return;
      }

      // ✅ mark seeded so it won't auto-popup next refresh
      localStorage.setItem(
        "seedConfig.v1",
        JSON.stringify({ seededAt: Date.now(), cfg })
      );

      setSeedOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Could not contact API to seed. Is the API running?");
    } finally {
      setSeeding(false);
    }
  };

  const openReseed = () => {
    setSeedMode("reseed");
    setSeedOpen(true);
  };

  return (
    <>
      {/* ✅ Re-seed button (shows modal on demand) */}
      <button
        onClick={openReseed}
        disabled={seeding}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 9999,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.65)",
          color: "white",
          cursor: seeding ? "not-allowed" : "pointer",
        }}
        title="Repopulate fake data"
      >
        Re-seed DB
      </button>

      <SeedConfigModal
        open={seedOpen}
        onClose={() => !seeding && setSeedOpen(false)}
        onApply={handleSeedApply}
        // optional: if your modal wants to show a label
        mode={seedMode}
      />

      {/* seeding overlay */}
      {seeding && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            color: "white",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {seedMode === "reseed"
            ? "Resetting + seeding database… please wait."
            : "Seeding database… please wait."}
        </div>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <AuthGate>
              <Navigate to="/customers" replace />
            </AuthGate>
          }
        />
        <Route
          path="/customers"
          element={
            <AuthGate>
              <CustomersPage />
            </AuthGate>
          }
        />
        <Route
          path="/packages"
          element={
            <AuthGate>
              <PackagesPage />
            </AuthGate>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <AuthGate>
              <SubscriptionsPage />
            </AuthGate>
          }
        />
        <Route
          path="/payments"
          element={
            <AuthGate>
              <PaymentsPage />
            </AuthGate>
          }
        />
        <Route
          path="/analytics"
          element={
            <AuthGate>
              <AnalyticsPage />
            </AuthGate>
          }
        />

        <Route path="*" element={<Navigate to="/customers" replace />} />
      </Routes>
    </>
  );
}
