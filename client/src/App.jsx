// client/src/App.jsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import AuthGate from "./AuthGate.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";

import CustomersPage from "./pages/customers/CustomersPage.jsx";
import PackagesPage from "./pages/packages/PackagesPage.jsx";
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage.jsx";
import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import AnalyticsPage from "./pages/analytics/AnalyticsPage.jsx";

import SeedConfigModal from "./components/SeedConfigModal.jsx";
import SnapshotModal from "./components/SnapshotModal.jsx";
import NorthAmericaMapModal from "./components/NorthAmericaMapModal.jsx";
import HelpModal from "./components/HelpModal.jsx";
import CallModal from "./components/CallModal.jsx";

function AuthedShell({
  children,
  seedOpen,
  setSeedOpen,
  snapshotOpen,
  callOpen,
  setCallOpen,
  setSnapshotOpen,
  naMapOpen,
  setNaMapOpen,
  helpOpen,
  setHelpOpen,
  seeding,
  seedMode,
  openReseed,
  handleSeedApply,
}) {
  const navigate = useNavigate();

  return (
    <AuthGate>
      <>
        {/* Bottom-right floating menu */}
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <button
            onClick={() => setNaMapOpen(true)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(0,0,0,0.65)",
              color: "white",
              cursor: "pointer",
            }}
            title="Open North America map"
          >
            Our Clients
          </button>

          <button
            onClick={() => setCallOpen(true)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(0,0,0,0.65)",
              color: "white",
              cursor: "pointer",
            }}
            title="Call Center"
          >
            Call Center
          </button>

          <button
            onClick={() => setSnapshotOpen(true)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(0,0,0,0.65)",
              color: "white",
              cursor: "pointer",
            }}
            title="Snapshot"
          >
            Snapshot
          </button>

          <button
            onClick={() => setHelpOpen(true)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(0,0,0,0.65)",
              color: "white",
              cursor: "pointer",
            }}
            title="Help"
          >
            HELP!
          </button>

          <button
            onClick={openReseed}
            disabled={seeding}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(0,0,0,0.65)",
              color: "white",
              cursor: seeding ? "not-allowed" : "pointer",
              opacity: seeding ? 0.6 : 1,
            }}
            title="Repopulate fake data"
          >
            Re-seed DB
          </button>
        </div>

        {/* Modals */}
        <NorthAmericaMapModal
          open={naMapOpen}
          onClose={() => setNaMapOpen(false)}
        />

        <SnapshotModal
          open={snapshotOpen}
          onClose={() => setSnapshotOpen(false)}
        />

        <CallModal
          open={callOpen}
          onClose={() => setCallOpen(false)}
        />

        <HelpModal
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
        />

        <SeedConfigModal
          open={seedOpen}
          onClose={() => !seeding && setSeedOpen(false)}
          onApply={handleSeedApply}
          mode={seedMode}
        />

        {/* Seeding overlay */}
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
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [naMapOpen, setNaMapOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  // "first" => initial seed (no reset)
  // "reseed" => wipe + seed from scratch
  const [seedMode, setSeedMode] = useState("first");

  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
    []
  );

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
        seedCustomers: cfg.seedCustomers,
        seedSubscriptions: cfg.seedSubscriptions,
        seedRandomSeed: cfg.seedRandomSeed,
        seedSkipIfExists: cfg.seedSkipIfExists,
        seedDistribution: cfg.seedDistribution,
        seedPostalDistribution: cfg.seedPostalDistribution || "mixed_realistic",
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

      localStorage.setItem(
        "seedConfig.v1",
        JSON.stringify({
          seededAt: Date.now(),
          cfg: {
            seedCustomers: cfg.seedCustomers,
            seedSubscriptions: cfg.seedSubscriptions,
            seedRandomSeed: cfg.seedRandomSeed,
            seedSkipIfExists: cfg.seedSkipIfExists,
            seedDistribution: cfg.seedDistribution,
            seedPostalDistribution: cfg.seedPostalDistribution || "mixed_realistic",
          },
        })
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

  const authedShellProps = {
    seedOpen,
    setSeedOpen,
    snapshotOpen,
    setSnapshotOpen,
    callOpen,
    setCallOpen,
    naMapOpen,
    setNaMapOpen,
    helpOpen,
    setHelpOpen,
    seeding,
    seedMode,
    openReseed,
    handleSeedApply,
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated */}
      <Route
        path="/"
        element={
          <AuthedShell {...authedShellProps}>
            <Navigate to="/customers" replace />
          </AuthedShell>
        }
      />

      <Route
        path="/customers"
        element={
          <AuthedShell {...authedShellProps}>
            <CustomersPage />
          </AuthedShell>
        }
      />

      <Route
        path="/packages"
        element={
          <AuthedShell {...authedShellProps}>
            <PackagesPage />
          </AuthedShell>
        }
      />

      <Route
        path="/subscriptions"
        element={
          <AuthedShell {...authedShellProps}>
            <SubscriptionsPage />
          </AuthedShell>
        }
      />

      <Route
        path="/payments"
        element={
          <AuthedShell {...authedShellProps}>
            <PaymentsPage />
          </AuthedShell>
        }
      />

      <Route
        path="/analytics"
        element={
          <AuthedShell {...authedShellProps}>
            <AnalyticsPage />
          </AuthedShell>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}