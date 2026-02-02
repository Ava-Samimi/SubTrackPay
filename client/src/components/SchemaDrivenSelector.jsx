import React, { useEffect, useMemo, useState } from "react";

/**
 * SchemaDrivenSelector
 * - Builds dropdowns from db_schema.json (models + fields)
 * - Non-technical: user chooses “What data?”, “Measure”, “Over time?”, “Group by / Breakdown”
 * - Emits querySpec + a plain-English sentence
 * - ✅ Adds a Plotly chart dropdown that adapts to user selections
 *
 * Props:
 *  - schema: db_schema.json payload (from /api/data/db/schema)
 *  - onChange: (state) => void
 *
 * Notes:
 *  - This DOES NOT run SQL. It produces a safe “querySpec” you can send to the server later.
 *  - Relations: inferred by Prisma types (field.type === another model name)
 */
export default function SchemaDrivenSelector({ schema, onChange }) {
  const models = useMemo(() => (Array.isArray(schema?.models) ? schema.models : []), [schema]);
  const modelNameSet = useMemo(() => new Set(models.map((m) => m.model)), [models]);

  const isRelationField = (f) => modelNameSet.has(f?.type);
  const isScalarField = (f) => !!f && !isRelationField(f);

  const fieldKind = (prismaType) => {
    const t = String(prismaType || "").toLowerCase();
    if (t.includes("date") || t.includes("time")) return "date";
    if (t.includes("bool")) return "bool";
    if (t.includes("int") || t.includes("bigint") || t.includes("float") || t.includes("decimal"))
      return "number";
    return "text";
  };

  const scalarFields = (modelName) => {
    const m = models.find((x) => x.model === modelName);
    return (m?.fields || []).filter(isScalarField);
  };

  const relationTargetsFromModel = (modelName) => {
    const m = models.find((x) => x.model === modelName);
    const rel = (m?.fields || []).filter(isRelationField).map((f) => f.type);
    return Array.from(new Set(rel)).sort((a, b) => a.localeCompare(b));
  };

  // Heuristics: detect “time fields”
  const timeFieldCandidates = (modelName) => {
    const fields = scalarFields(modelName);
    const dateFields = fields.filter((f) => fieldKind(f.type) === "date");
    const score = (name) => {
      const n = String(name || "").toLowerCase();
      if (n.includes("created")) return 4;
      if (n.includes("date")) return 3;
      if (n.includes("time")) return 2;
      if (n.includes("updated")) return 1;
      return 0;
    };
    return dateFields
      .slice()
      .sort((a, b) => score(b.name) - score(a.name) || a.name.localeCompare(b.name));
  };

  // Heuristics: detect “status-like” fields for Active/Inactive
  const statusFieldCandidates = (modelName) => {
    const fields = scalarFields(modelName);
    const textFields = fields.filter((f) => fieldKind(f.type) === "text");
    const score = (name) => {
      const n = String(name || "").toLowerCase();
      if (n === "status") return 10;
      if (n.includes("status")) return 8;
      if (n.includes("state")) return 6;
      if (n.includes("active")) return 4;
      return 0;
    };
    return textFields
      .slice()
      .sort((a, b) => score(b.name) - score(a.name) || a.name.localeCompare(b.name));
  };

  const numberFieldCandidates = (modelName) =>
    scalarFields(modelName).filter((f) => fieldKind(f.type) === "number");

  const dimensionFieldCandidates = (modelName) => {
    const fields = scalarFields(modelName);
    const dims = fields.filter((f) => {
      const k = fieldKind(f.type);
      return k === "text" || k === "bool" || k === "date";
    });

    const score = (name) => {
      const n = String(name || "").toLowerCase();
      if (n === "id") return -10;
      if (n.includes("id")) return -3;
      if (n.includes("name")) return 5;
      if (n.includes("type")) return 4;
      if (n.includes("plan") || n.includes("package")) return 4;
      if (n.includes("country") || n.includes("city") || n.includes("region")) return 4;
      if (n.includes("status")) return 3;
      return 0;
    };

    return dims.slice().sort((a, b) => score(b.name) - score(a.name) || a.name.localeCompare(b.name));
  };

  // ----------------- UI state -----------------
  const [primaryModel, setPrimaryModel] = useState(models[0]?.model || "");
  const [mode, setMode] = useState("timeseries"); // timeseries | snapshot
  const [range, setRange] = useState("10y"); // 10y | 5y | 12m | 6m
  const [bucket, setBucket] = useState("month"); // month | week | day

  // measure
  const [measure, setMeasure] = useState("count"); // count | sum | avg | min | max
  const [measureField, setMeasureField] = useState(""); // numeric field when measure != count

  // “active” toggle
  const [onlyActive, setOnlyActive] = useState(false);
  const [statusField, setStatusField] = useState("");
  const [activeValue, setActiveValue] = useState("active");

  // group/breakdown
  const [groupByField, setGroupByField] = useState("");
  const [relModel, setRelModel] = useState("");
  const [relField, setRelField] = useState("");

  // time field
  const [timeField, setTimeField] = useState("");

  // init defaults when schema loads
  useEffect(() => {
    if (!primaryModel && models.length > 0) setPrimaryModel(models[0].model);
  }, [models, primaryModel]);

  // update recommended defaults when primary model changes
  useEffect(() => {
    if (!primaryModel) return;

    const t = timeFieldCandidates(primaryModel)[0]?.name || "";
    setTimeField(t);

    const s = statusFieldCandidates(primaryModel)[0]?.name || "";
    setStatusField(s);

    const num = numberFieldCandidates(primaryModel)[0]?.name || "";
    setMeasureField(num);

    setRelModel("");
    setRelField("");
    setGroupByField("");
  }, [primaryModel]);

  // when measure changes, ensure measureField is usable
  useEffect(() => {
    if (measure === "count") return;
    const nums = numberFieldCandidates(primaryModel);
    if (!nums.find((f) => f.name === measureField)) {
      setMeasureField(nums[0]?.name || "");
    }
  }, [measure, primaryModel]);

  // when relModel changes, pick a default relField
  useEffect(() => {
    if (!relModel) {
      setRelField("");
      return;
    }
    const dims = dimensionFieldCandidates(relModel);
    setRelField(dims[0]?.name || "");
  }, [relModel]);

  // guardrails
  useEffect(() => {
    if (mode !== "timeseries") {
      setBucket("month");
      setTimeField("");
    } else {
      // if we switched back to timeseries, restore best guess if empty
      if (!timeField) {
        const t = timeFieldCandidates(primaryModel)[0]?.name || "";
        setTimeField(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const ranges = [
    { id: "10y", label: "Past 10 years" },
    { id: "5y", label: "Past 5 years" },
    { id: "12m", label: "Past 12 months" },
    { id: "6m", label: "Past 6 months" },
  ];

  const buckets = [
    { id: "month", label: "Monthly" },
    { id: "week", label: "Weekly" },
    { id: "day", label: "Daily" },
  ];

  const measureLabel = useMemo(() => {
    if (measure === "count") return "count";
    return `${measure} of ${measureField || "(field)"}`;
  }, [measure, measureField]);

  // ----------------- Plotly chart dropdown (recommended) -----------------
  const chartOptions = useMemo(() => {
    const opts = [];
    const isTime = mode === "timeseries";
    const hasGroup = !!groupByField;
    const hasBreakdown = !!(relModel && relField);

    const push = (id, label) => {
      if (opts.some((x) => x.id === id)) return;
      opts.push({ id, label });
    };

    // TIME SERIES
    if (isTime) {
      if (!hasGroup && !hasBreakdown) {
        push("line", "Line (time series)");
        push("area", "Area (filled line)");
        push("scatter", "Scatter (points over time)");
        push("bar_time", "Bar (time on x-axis)");
        push("step", "Step line");
        push("line_smooth", "Line with smoothing (trend)");
      } else {
        // categories over time
        push("line_multi", "Multi-line (one per group)");
        push("area_stack", "Stacked area (composition over time)");
        push("bar_stack_time", "Stacked bar (composition over time)");
        push("heatmap_time_group", "Heatmap (time vs group)");
      }
      return opts;
    }

    // SNAPSHOT
    const categoryLike = hasGroup || hasBreakdown;

    if (categoryLike) {
      push("bar", "Bar (compare categories)");
      push("horizontal_bar", "Horizontal bar (many categories)");
      push("pie", "Pie (share of total)");
      push("donut", "Donut (share of total)");
      push("treemap", "Treemap");
      push("table", "Table (ranked list)");
    } else {
      push("indicator", "Indicator (big number)");
      push("gauge", "Gauge (if you want a target)");
      push("table", "Table (single row)");
    }

    return opts;
  }, [mode, groupByField, relModel, relField]);

  const [chartId, setChartId] = useState("line");

  // choose default chart whenever chart options change
  useEffect(() => {
    const first = chartOptions[0]?.id || "line";
    setChartId(first);
  }, [chartOptions]);

  // ----------------- sentence -----------------
  const sentence = useMemo(() => {
    if (!primaryModel) return "Select data to begin.";

    let s = `Show me the ${measureLabel} from ${primaryModel}`;

    if (onlyActive) {
      s += ` where ${statusField || "status"} is "${activeValue}"`;
    }

    if (mode === "timeseries") {
      s += ` over time`;
      s += ` for the ${ranges.find((r) => r.id === range)?.label?.toLowerCase() || "selected period"}`;
      s += `, grouped ${buckets.find((b) => b.id === bucket)?.label?.toLowerCase() || bucket}`;
      if (timeField) s += ` using ${primaryModel}.${timeField}`;
    } else {
      s += ` as a snapshot for the ${ranges.find((r) => r.id === range)?.label?.toLowerCase() || "selected period"}`;
    }

    if (groupByField) s += `, grouped by ${primaryModel}.${groupByField}`;
    if (relModel && relField) s += `, broken down by ${relModel}.${relField}`;

    const chartLabel = chartOptions.find((c) => c.id === chartId)?.label;
    if (chartLabel) s += ` (shown as: ${chartLabel.toLowerCase()})`;

    return s + ".";
  }, [
    primaryModel,
    measureLabel,
    onlyActive,
    statusField,
    activeValue,
    mode,
    range,
    bucket,
    timeField,
    groupByField,
    relModel,
    relField,
    chartId,
    chartOptions,
  ]);

  const querySpec = useMemo(() => {
    return {
      primaryModel,
      mode,
      range,
      bucket: mode === "timeseries" ? bucket : null,
      timeField: mode === "timeseries" ? timeField : null,

      measure,
      measureField: measure === "count" ? null : measureField,

      onlyActive,
      statusField: onlyActive ? statusField : null,
      activeValue: onlyActive ? activeValue : null,

      groupByField: groupByField || null,
      breakdown: relModel && relField ? { model: relModel, field: relField } : null,

      // ✅ NEW: chosen plotly chart suggestion
      chart: chartId,
    };
  }, [
    primaryModel,
    mode,
    range,
    bucket,
    timeField,
    measure,
    measureField,
    onlyActive,
    statusField,
    activeValue,
    groupByField,
    relModel,
    relField,
    chartId,
  ]);

  useEffect(() => {
    onChange?.({ querySpec, sentence });
  }, [querySpec, sentence, onChange]);

  // ----------------- styles -----------------
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
  const inputStyle = { ...selectStyle };
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

  // ----------------- derived options -----------------
  const modelOptions = useMemo(
    () => models.map((m) => m.model).slice().sort((a, b) => a.localeCompare(b)),
    [models]
  );

  const timeOptions = useMemo(() => timeFieldCandidates(primaryModel), [primaryModel, models]);
  const statusOptions = useMemo(() => statusFieldCandidates(primaryModel), [primaryModel, models]);
  const numOptions = useMemo(() => numberFieldCandidates(primaryModel), [primaryModel, models]);
  const dimOptions = useMemo(() => dimensionFieldCandidates(primaryModel), [primaryModel, models]);

  const relTargets = useMemo(() => relationTargetsFromModel(primaryModel), [primaryModel, models]);
  const relDimOptions = useMemo(
    () => (relModel ? dimensionFieldCandidates(relModel) : []),
    [relModel, models]
  );

  return (
    <div className="entity-card" style={{ marginTop: 14 }}>
      <div className="entity-label">Schema-Driven Builder</div>
      <div className="entity-muted" style={{ marginTop: 6 }}>
        This menu builds itself from your database schema (no manual config).
      </div>

      <div style={labelStyle}>Choose Data</div>
      <select
        style={selectStyle}
        value={primaryModel}
        onChange={(e) => setPrimaryModel(e.target.value)}
      >
        {modelOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <div style={labelStyle}>View</div>
      <select style={selectStyle} value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="timeseries">Time series (over time)</option>
        <option value="snapshot">Snapshot (single summary)</option>
      </select>

      <div style={labelStyle}>Time Range</div>
      <select style={selectStyle} value={range} onChange={(e) => setRange(e.target.value)}>
        {ranges.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      <div style={labelStyle}>Time Grouping</div>
      <select
        style={selectStyle}
        value={bucket}
        onChange={(e) => setBucket(e.target.value)}
        disabled={mode !== "timeseries"}
      >
        {buckets.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>

      <div style={labelStyle}>Time Field</div>
      <select
        style={selectStyle}
        value={timeField}
        onChange={(e) => setTimeField(e.target.value)}
        disabled={mode !== "timeseries"}
        title={mode !== "timeseries" ? "Switch to Time series to use a time field" : ""}
      >
        <option value="">(auto)</option>
        {timeOptions.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name} ({f.type})
          </option>
        ))}
      </select>

      <div style={labelStyle}>Measure</div>
      <select style={selectStyle} value={measure} onChange={(e) => setMeasure(e.target.value)}>
        <option value="count">Count rows</option>
        <option value="sum">Sum</option>
        <option value="avg">Average</option>
        <option value="min">Minimum</option>
        <option value="max">Maximum</option>
      </select>

      {measure !== "count" ? (
        <>
          <div style={labelStyle}>Measure Field (numeric)</div>
          <select
            style={selectStyle}
            value={measureField}
            onChange={(e) => setMeasureField(e.target.value)}
          >
            <option value="">(select)</option>
            {numOptions.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.type})
              </option>
            ))}
          </select>
        </>
      ) : null}

      <div style={labelStyle}>Only Active?</div>
      <select
        style={selectStyle}
        value={onlyActive ? "yes" : "no"}
        onChange={(e) => setOnlyActive(e.target.value === "yes")}
      >
        <option value="no">No</option>
        <option value="yes">Yes (filter using a status field)</option>
      </select>

      {onlyActive ? (
        <>
          <div style={labelStyle}>Status Field</div>
          <select
            style={selectStyle}
            value={statusField}
            onChange={(e) => setStatusField(e.target.value)}
          >
            <option value="">(select)</option>
            {statusOptions.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.type})
              </option>
            ))}
          </select>

          <div style={labelStyle}>Active Value</div>
          <input
            style={inputStyle}
            value={activeValue}
            onChange={(e) => setActiveValue(e.target.value)}
            placeholder='e.g. "active"'
          />
        </>
      ) : null}

      <div style={labelStyle}>Group By (optional)</div>
      <select
        style={selectStyle}
        value={groupByField}
        onChange={(e) => setGroupByField(e.target.value)}
      >
        <option value="">(none)</option>
        {dimOptions.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name} ({f.type})
          </option>
        ))}
      </select>

      <div style={labelStyle}>Breakdown by Related Data (optional)</div>
      <select style={selectStyle} value={relModel} onChange={(e) => setRelModel(e.target.value)}>
        <option value="">(none)</option>
        {relTargets.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {relModel ? (
        <>
          <div style={labelStyle}>Related Field</div>
          <select style={selectStyle} value={relField} onChange={(e) => setRelField(e.target.value)}>
            <option value="">(select)</option>
            {relDimOptions.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.type})
              </option>
            ))}
          </select>
        </>
      ) : null}

      {/* ✅ NEW: Plotly chart dropdown */}
      <div style={labelStyle}>Recommended Plotly chart</div>
      <select style={selectStyle} value={chartId} onChange={(e) => setChartId(e.target.value)}>
        {chartOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Plain English sentence */}
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
          {sentence}
        </div>
      </div>

      <button
        style={btnStyle}
        onClick={() => {
          console.log("RUN (schema-driven) querySpec:", querySpec);
          alert("Next step: POST querySpec to your API and return Plotly-ready data.");
        }}
      >
        Run Analysis
      </button>

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
