const DEFAULTS = {
  seedCustomers: 500,
  seedSubscriptions: 500,
  seedRandomSeed: "", // empty means random each run
  seedSkipIfExists: true,
  seedDistribution: "uniform", // uniform | popular_packages | heavy_monthly | realistic_default
};

const STORAGE_KEY = "seedConfig.v1";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export default function SeedConfigModal({ open, onClose, onApply }) {
  const saved = useMemo(() => loadSaved(), []);
  const initial = saved ? { ...DEFAULTS, ...saved } : DEFAULTS;

  const [seedCustomers, setSeedCustomers] = useState(initial.seedCustomers);
  const [seedSubscriptions, setSeedSubscriptions] = useState(initial.seedSubscriptions);
  const [seedRandomSeed, setSeedRandomSeed] = useState(initial.seedRandomSeed);
  const [seedSkipIfExists, setSeedSkipIfExists] = useState(initial.seedSkipIfExists);
  const [seedDistribution, setSeedDistribution] = useState(initial.seedDistribution);

  // Keep state in sync if modal opens later
  useEffect(() => {
    if (!open) return;
    const latest = loadSaved();
    const init = latest ? { ...DEFAULTS, ...latest } : DEFAULTS;
    setSeedCustomers(init.seedCustomers);
    setSeedSubscriptions(init.seedSubscriptions);
    setSeedRandomSeed(init.seedRandomSeed);
    setSeedSkipIfExists(init.seedSkipIfExists);
    setSeedDistribution(init.seedDistribution);
  }, [open]);

  if (!open) return null;

  const errors = [];
  if (!Number.isFinite(seedCustomers) || seedCustomers < 1 || seedCustomers > 200000) {
    errors.push("Customers must be between 1 and 200000.");
  }
  if (!Number.isFinite(seedSubscriptions) || seedSubscriptions < 0 || seedSubscriptions > 500000) {
    errors.push("Subscriptions must be between 0 and 500000.");
  }
  if (seedRandomSeed !== "") {
    const n = Number(seedRandomSeed);
    if (!Number.isInteger(n) || n < 0 || n > 2147483647) {
      errors.push("Random seed must be empty or an integer between 0 and 2147483647.");
    }
  }

  const handleApply = () => {
    if (errors.length) return;

    const cfg = {
      seedCustomers: Number(seedCustomers),
      seedSubscriptions: Number(seedSubscriptions),
      seedRandomSeed: seedRandomSeed === "" ? "" : String(Number(seedRandomSeed)),
      seedSkipIfExists: Boolean(seedSkipIfExists),
      seedDistribution,
    };

    saveConfig(cfg);
    onApply?.(cfg);
    onClose?.();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Seeder Configuration</h2>
          <button onClick={onClose} style={styles.xBtn} aria-label="Close">
            ✕
          </button>
        </div>

        <p style={styles.subtext}>
          Choose how fake data is generated on startup. These settings are saved in your browser.
        </p>

        <div style={styles.grid}>
          <label style={styles.label}>
            Customers
            <input
              type="number"
              min={1}
              max={200000}
              value={seedCustomers}
              onChange={(e) => setSeedCustomers(Number(e.target.value))}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Subscriptions
            <input
              type="number"
              min={0}
              max={500000}
              value={seedSubscriptions}
              onChange={(e) => setSeedSubscriptions(Number(e.target.value))}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Random seed (optional)
            <input
              type="text"
              placeholder="leave blank = random each run"
              value={seedRandomSeed}
              onChange={(e) => setSeedRandomSeed(e.target.value.trim())}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Distribution
            <select
              value={seedDistribution}
              onChange={(e) => setSeedDistribution(e.target.value)}
              style={styles.input}
            >
              <option value="uniform">uniform</option>
              <option value="popular_packages">popular_packages</option>
              <option value="heavy_monthly">heavy_monthly</option>
              <option value="realistic_default">realistic_default</option>
            </select>
          </label>
        </div>

        <label style={styles.toggleRow}>
          <input
            type="checkbox"
            checked={seedSkipIfExists}
            onChange={(e) => setSeedSkipIfExists(e.target.checked)}
          />
          <span style={{ marginLeft: 10 }}>
            Skip seeding if customers already exist (recommended)
          </span>
        </label>

        {errors.length > 0 && (
          <div style={styles.errorBox}>
            {errors.map((err) => (
              <div key={err}>• {err}</div>
            ))}
          </div>
        )}

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnSecondary}>
            Cancel
          </button>
          <button onClick={handleApply} style={styles.btnPrimary} disabled={errors.length > 0}>
            Apply
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
    width: "min(720px, 100%)",
    background: "#0f1115",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "white",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  xBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  subtext: { marginTop: 10, marginBottom: 16, opacity: 0.85 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 14, opacity: 0.95 },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    outline: "none",
  },
  toggleRow: { display: "flex", alignItems: "center", marginTop: 14, fontSize: 14 },
  errorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,0,0,0.25)",
    background: "rgba(255,0,0,0.08)",
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
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
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    opacity: 1,
  },
};
