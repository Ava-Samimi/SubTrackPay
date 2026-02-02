import React, { useEffect, useMemo, useState } from "react";

export default function AnalyticsLeftShow({
  onShow,
  disabled = false,
  configUrl = "/config/left_bar_helper.json",
}) {
  const [cfg, setCfg] = useState(null);
  const [cfgErr, setCfgErr] = useState("");
  const [cfgLoading, setCfgLoading] = useState(true);

  // dynamic form state
  const [form, setForm] = useState({});

  // Load config once
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setCfgLoading(true);
        setCfgErr("");

        const res = await fetch(configUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Config HTTP ${res.status}`);

        const json = await res.json();

        if (cancelled) return;
        setCfg(json);

        // initialize defaults
        const metricKey = json?.metricSelect?.key || "metric";
        const metricDefault = json?.metricSelect?.default || "";

        const initial = { [metricKey]: metricDefault };

        const fields = json?.metrics?.[metricDefault]?.fields || [];
        for (const f of fields) {
          if (f?.key) initial[f.key] = f.default ?? "";
        }

        setForm(initial);
        setCfgLoading(false);
      } catch (e) {
        if (cancelled) return;
        console.error("Failed to load left bar helper config:", e);
        setCfgErr(e?.message || "Failed to load config.");
        setCfgLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [configUrl]);

  const metricKey = cfg?.metricSelect?.key || "metric";
  const metricValue = form?.[metricKey] || "";

  const activeFields = useMemo(() => {
    if (!cfg) return [];
    return cfg?.metrics?.[metricValue]?.fields || [];
  }, [cfg, metricValue]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleMetricChange(nextMetric) {
    // When metric changes, reset its fields to defaults
    if (!cfg) return;

    const next = { ...form, [metricKey]: nextMetric };

    // remove old dynamic fields (optional cleanup)
    const allMetricFields = Object.values(cfg.metrics || {})
      .flatMap((m) => m?.fields || [])
      .map((f) => f?.key)
      .filter(Boolean);

    for (const k of allMetricFields) {
      delete next[k];
    }

    // apply defaults for new metric fields
    const fields = cfg?.metrics?.[nextMetric]?.fields || [];
    for (const f of fields) {
      if (f?.key) next[f.key] = f.default ?? "";
    }

    setForm(next);
  }

  function handleShow() {
    if (disabled || cfgLoading || cfgErr) return;
    onShow?.(form); // sends { metric: "...", basis: "...", ... }
  }

  const selectStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(57, 255, 20, 0.35)",
    background: "#000",
    color: "#39ff14",
    fontWeight: 900,
    outline: "none",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(57, 255, 20, 0.85)",
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.3,
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(57, 255, 20, 0.6)",
    background: disabled || cfgLoading || cfgErr ? "rgba(0,0,0,0.6)" : "#000",
    color: disabled || cfgLoading || cfgErr ? "rgba(57,255,20,0.45)" : "#39ff14",
    fontWeight: 900,
    cursor: disabled || cfgLoading || cfgErr ? "not-allowed" : "pointer",
    marginTop: 12,
  };

  return (
    <div className="analytics-formcard" style={{ marginTop: 14 }}>
      <div className="analytics-label">{cfg?.title || "Action"}</div>

      {cfgLoading ? (
        <div className="analytics-muted" style={{ marginTop: 8 }}>
          Loading…
        </div>
      ) : cfgErr ? (
        <div className="analytics-error" style={{ marginTop: 8 }}>
          {cfgErr}
        </div>
      ) : (
        <>
          {/* Main dropdown: Metric */}
          <div style={labelStyle}>{cfg?.metricSelect?.label || "Metric"}</div>
          <select
            value={metricValue}
            onChange={(e) => handleMetricChange(e.target.value)}
            style={selectStyle}
            disabled={disabled}
          >
            {(cfg?.metricSelect?.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Dynamic fields for selected metric */}
          {activeFields.map((f) => {
            if (!f || f.type !== "select") return null;

            const v = form?.[f.key] ?? "";

            return (
              <div key={f.key}>
                <div style={labelStyle}>{f.label || f.key}</div>
                <select
                  value={v}
                  onChange={(e) => setField(f.key, e.target.value)}
                  style={selectStyle}
                  disabled={disabled}
                >
                  {(f.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <button
            type="button"
            className="analytics-btn"
            onClick={handleShow}
            style={buttonStyle}
            disabled={disabled || cfgLoading || !!cfgErr}
          >
            Show
          </button>
        </>
      )}
    </div>
  );
}
