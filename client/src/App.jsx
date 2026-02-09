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

function AuthedShell({
  children,
  seedOpen,
  setSeedOpen,
  seeding,
  seedMode,
  openReseed,
  handleSeedApply,
}) {
  return (
    <AuthGate>
      <>
        {/* ✅ Re-seed button (only for authenticated pages) */}
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

        {/* ✅ Seed modal (only for authenticated pages) */}
        <SeedConfigModal
          open={seedOpen}
          onClose={() => !seeding && setSeedOpen(false)}
          onApply={handleSeedApply}
          mode={seedMode}
        />

        {/* ✅ Seeding overlay (only for authenticated pages) */}
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

        {children}
      </>
    </AuthGate>
  );
}

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
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated */}
      <Route
        path="/"
        element={
          <AuthedShell
            seedOpen={seedOpen}
            setSeedOpen={setSeedOpen}
            seeding={seeding}
            seedMode={seedMode}
            openReseed={openReseed}
            handleSeedApply={handleSeedApply}
          >
            <Navigate to="/customers" replace />
          </AuthedShell>
        }
      />
      <Route
        path="/customers"
        element={
          <AuthedShell
            seedOpen={seedOpen}
            setSeedOpen={setSeedOpen}
            seeding={seeding}
            seedMode={seedMode}
            openReseed={openReseed}
            handleSeedApply={handleSeedApply}
          >
            <CustomersPage />
          </AuthedShell>
        }
      />
      <Route
        path="/packages"
        element={
          <AuthedShell
            seedOpen={seedOpen}
            setSeedOpen={setSeedOpen}
            seeding={seeding}
            seedMode={seedMode}
            openReseed={openReseed}
            handleSeedApply={handleSeedApply}
          >
            <PackagesPage />
          </AuthedShell>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <AuthedShell
            seedOpen={seedOpen}
            setSeedOpen={setSeedOpen}
            seeding={seeding}
            seedMode={seedMode}
            openReseed={openReseed}
            handleSeedApply={handleSeedApply}
          >
            <SubscriptionsPage />
          </AuthedShell>
        }
      />
      <Route
        path="/payments"
        element={
          <AuthedShell
            seedOpen={seedOpen}
            setSeedOpen={setSeedOpen}
            seeding={seeding}
            seedMode={seedMode}
            openReseed={openReseed}
            handleSeedApply={handleSeedApply}
          >
            <PaymentsPage />
          </AuthedShell>
        }
      />
      <Route
        path="/analytics"
        element={
          <AuthedShell
            seedOpen={seedOpen}
            setSeedOpen={setSeedOpen}
            seeding={seeding}
            seedMode={seedMode}
            openReseed={openReseed}
            handleSeedApply={handleSeedApply}
          >
            <AnalyticsPage />
          </AuthedShell>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
