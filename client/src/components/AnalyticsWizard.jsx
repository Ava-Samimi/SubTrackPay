import React, { useEffect, useMemo, useState } from "react";

/**
 * Non-technical analytics wizard:
 * - Friendly dropdowns
 * - Emits querySpec + a plain-English sentence describing the analysis
 * - ✅ Adds a Plotly chart dropdown that adapts to user selections
 *
 * Props:
 *  - schema: db_schema.json payload (optional for now)
 *  - onQueryChange: (state) => void
 */
export default function AnalyticsWizard({ schema, onQueryChange }) {
  // Curated list for now; later you can auto-generate from db_schema.json
  const METRICS = useMemo(
    () => [
      {
        id: "customers_count",
        label: "Customers (count)",
        description: "How many customers exist over time or as a snapshot.",
      },
      {
        id: "active_subscriptions_count",
        label: "Active subscriptions (count)",
        description: "Count subscriptions that are active at each point in time.",
      },
    ],
    []
  );

  const RANGES = useMemo(
    () => [
      { id: "10y", label: "Past 10 years" },
      { id: "5y", label: "Past 5 years" },
      { id: "12m", label: "Past 12 months" },
    ],
    []
  );

  const BUCKETS = useMemo(
    () => [
      { id: "month", label: "Monthly" },
      { id: "week", label: "Weekly" },
      { id: "day", label: "Daily" },
    ],
    []
  );

  const BREAKDOWNS = useMemo(
    () => [
      { id: "none", label: "(none)" },
      { id: "package", label: "Package" },
      { id: "customer", label: "Customer" },
    ],
    []
  );

  const [metricId, setMetricId] = useState("active_subscriptions_count");
  const [mode, setMode] = useState("timeseries"); // timeseries | single
  const [rangeId, setRangeId] = useState("10y");
  const [bucket, setBucket] = useState("month");
  const [activeAnchor, setActiveAnchor] = useState("month_start"); // month_start | month_end
  const [breakdown, setBreakdown] = useState("none");

  const metric = useMemo(() => METRICS.find((m) => m.id === metricId), [METRICS, metricId]);
  const range = useMemo(() => RANGES.find((r) => r.id === rangeId), [RANGES, rangeId]);

  const bucketLabel = useMemo(
    () => BUCKETS.find((b) => b.id === bucket)?.label || bucket,
    [BUCKETS, bucket]
  );

  const breakdownLabel = useMemo(
    () => BREAKDOWNS.find((b) => b.id === breakdown)?.label || breakdown,
    [BREAKDOWNS, breakdown]
  );

  // UX guardrails
  useEffect(() => {
    if (mode !== "timeseries") {
      setBucket("month");
      setActiveAnchor("month_start");
    }
  }, [mode]);

  useEffect(() => {
    if (bucket !== "month") {
      setActiveAnchor("month_start");
    }
  }, [bucket]);

  // ✅ Plotly chart recommendation logic
  const chartOptions = useMemo(() => {
    const opts = [];

    const isTime = mode === "timeseries";
    const hasBreakdown = breakdown !== "none";

    // helper: push unique by id
    const push = (id, label, reason = "") => {
      if (opts.some((x) => x.id === id)) return;
      opts.push({ id, label, reason });
    };

    // ---------- TIME SERIES ----------
    if (isTime) {
      if (!hasBreakdown) {
        push("line", "Line (time series)");
        push("area", "Area (filled line)");
        push("scatter", "Scatter (points over time)");
        push("bar_time", "Bar (time on x-axis)");
        push("step", "Step line (good for discrete changes)");
      } else {
        // breakdown time series
        push("line_multi", "Multi-line (one line per group)");
        push("area_stack", "Stacked area (composition over time)");
        push("bar_stack_time", "Stacked bar (composition over time)");
        push("heatmap_time_group", "Heatmap (time vs group)");
      }

      // extra for long ranges: trends / smoothing
      push("line_smooth", "Line with smoothing (trend)");

      return opts;
    }

    // ---------- SINGLE VALUE / SNAPSHOT ----------
    // If breakdown exists, we likely have categories to compare
    if (hasBreakdown) {
      push("bar", "Bar (compare categories)");
      push("horizontal_bar", "Horizontal bar (many categories)");
      push("pie", "Pie (share of total)");
      push("donut", "Donut (share of total)");
      push("treemap", "Treemap (share + hierarchy style)");
      push("table", "Table (ranked list)");
    } else {
      // truly a single number
      push("indicator", "Indicator (big number)");
      push("gauge", "Gauge (if you want a target later)");
      push("table", "Table (single row)");
    }

    return opts;
  }, [mode, breakdown]);

  // pick default chart when options change
  const [chartId, setChartId] = useState("line");
  useEffect(() => {
    const first = chartOptions[0]?.id || "line";
    setChartId(first);
  }, [chartOptions]);

  // Plain English sentence (changes with dropdowns)
  const humanSentence = useMemo(() => {
    if (!metric) return "Select options to describe the analysis.";

    let s = `Show me ${metric.label.toLowerCase()}`;

    if (mode === "timeseries") {
      s += " over time";
    }

    s += ` for the ${range?.label?.toLowerCase() || "selected period"}`;

    if (mode === "timeseries") {
      s += `, grouped ${bucketLabel.toLowerCase()}`;
    }

    if (
      metricId === "active_subscriptions_count" &&
      mode === "timeseries" &&
      bucket === "month"
    ) {
      s +=
        activeAnchor === "month_start"
          ? ", measured on the 1st of each month"
          : ", measured on the last day of each month";
    }

    if (breakdown !== "none") {
      s += `, broken down by ${breakdownLabel.toLowerCase()}`;
    }

    // mention chart style in a friendly way
    const chartLabel = chartOptions.find((c) => c.id === chartId)?.label;
    if (chartLabel) {
      s += ` (shown as: ${chartLabel.toLowerCase()})`;
    }

    return s + ".";
  }, [
    metric,
    metricId,
    mode,
    range,
    bucket,
    bucketLabel,
    activeAnchor,
    breakdown,
    breakdownLabel,
    chartId,
    chartOptions,
  ]);

  const querySpec = useMemo(() => {
    return {
      metric: metricId,
      mode,
      range: rangeId,
      bucket: mode === "timeseries" ? bucket : null,
      activeAnchor:
        metricId === "active_subscriptions_count" && mode === "timeseries" && bucket === "month"
          ? activeAnchor
          : null,
      breakdown: breakdown !== "none" ? breakdown : null,

      // ✅ NEW: selected chart type
      chart: chartId,
    };
  }, [metricId, mode, rangeId, bucket, activeAnchor, breakdown, chartId]);

  useEffect(() => {
    onQueryChange?.({ querySpec, humanSentence });
  }, [querySpec, humanSentence, onQueryChange]);

  const labelStyle = { fontWeight: 900, fontSize: 12, marginTop: 10, marginBottom: 6 };
  const selectStyle = {
    width: "100%",
    background: "rgba(0,0,0,0.65)",
    color: "#39ff14",
    border: "1px solid rgba(57,255,20,0.18)",
    borderRadius: 8,
    padding: "8px 10px",
    outline: "none",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  };

  const btnStyle = {
    width: "100%",
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(57,255,20,0.22)",
    background: "rgba(0,0,0,0.65)",
    color: "#39ff14",
    fontWeight: 900,
    cursor: "pointer",
  };

  return (
    <div className="entity-card" style={{ marginTop: 14 }}>
      <div className="entity-label">Analytics Builder</div>
      <div className="entity-muted" style={{ marginTop: 6 }}>
        Choose what you want — we build it for you (no SQL).{" "}
        {metric?.description ? <span style={{ opacity: 0.85 }}>{metric.description}</span> : null}
      </div>

      <div style={labelStyle}>What do you want to measure?</div>
      <select style={selectStyle} value={metricId} onChange={(e) => setMetricId(e.target.value)}>
        {METRICS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      <div style={labelStyle}>How do you want to view it?</div>
      <select style={selectStyle} value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="timeseries">Time series (over time)</option>
        <option value="single">Single value (one number)</option>
      </select>

      <div style={labelStyle}>Time range</div>
      <select style={selectStyle} value={rangeId} onChange={(e) => setRangeId(e.target.value)}>
        {RANGES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      <div style={labelStyle}>Time grouping</div>
      <select
        style={selectStyle}
        value={bucket}
        onChange={(e) => setBucket(e.target.value)}
        disabled={mode !== "timeseries"}
        title={mode !== "timeseries" ? "Switch to Time series to enable grouping" : ""}
      >
        {BUCKETS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>

      {metricId === "active_subscriptions_count" && mode === "timeseries" && bucket === "month" ? (
        <>
          <div style={labelStyle}>When to measure “active” each month?</div>
          <select
            style={selectStyle}
            value={activeAnchor}
            onChange={(e) => setActiveAnchor(e.target.value)}
          >
            <option value="month_start">On the 1st of each month</option>
            <option value="month_end">On the last day of each month</option>
          </select>
        </>
      ) : null}

      <div style={labelStyle}>Break down by (optional)</div>
      <select
        style={selectStyle}
        value={breakdown}
        onChange={(e) => setBreakdown(e.target.value)}
      >
        {BREAKDOWNS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>

      {/* ✅ NEW: Plotly chart dropdown */}
      <div style={labelStyle}>Recommended Plotly chart</div>
      <select style={selectStyle} value={chartId} onChange={(e) => setChartId(e.target.value)}>
        {chartOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Plain-English sentence (live) */}
      <div
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 10,
          border: "1px solid rgba(57,255,20,0.22)",
          background: "rgba(0,0,0,0.55)",
        }}
      >
        <div className="entity-label">What this analysis will show</div>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(57,255,20,0.95)",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {humanSentence}
        </div>
      </div>

      <button
        style={btnStyle}
        onClick={() => {
          console.log("RUN ANALYSIS:", querySpec);
          alert("Next step: POST querySpec to your API and return Plotly-ready data.");
        }}
      >
        Run Analysis
      </button>

      {/* Optional dev-only peek */}
      <details style={{ marginTop: 10, opacity: 0.9 }}>
        <summary style={{ cursor: "pointer", fontWeight: 900, fontSize: 12 }}>
          Advanced (debug)
        </summary>
        <pre
          style={{
            marginTop: 8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(57,255,20,0.12)",
            background: "rgba(0,0,0,0.45)",
            color: "rgba(57,255,20,0.92)",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {JSON.stringify(querySpec, null, 2)}
        </pre>
      </details>
    </div>
  );
}
