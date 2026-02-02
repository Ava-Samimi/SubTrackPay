// AnalyticsRecipePicker.jsx
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

export default function AnalyticsRecipePicker({ schema, onChange, onRun }) {
  const models = useMemo(() => (Array.isArray(schema?.models) ? schema.models : []), [schema]);
  const modelSet = useMemo(() => new Set(models.map((m) => m.model)), [models]);

  const BUCKETS = useMemo(
    () => [
      { id: "week", label: "Weekly" },
      { id: "month", label: "Monthly" },
      { id: "year", label: "Yearly" },
    ],
    []
  );

  const RANGES = useMemo(
    () => [
      { id: "12m", label: "Past 12 months" },
      { id: "5y", label: "Past 5 years" },
      { id: "10y", label: "Past 10 years" },
    ],
    []
  );

  const has = (...names) => names.every((n) => modelSet.has(n));

  // ✅ Full recipe list (unchanged)
  const RECIPES = useMemo(() => {
    const base = [
      {
        id: "customers_count_group_by_package",
        title: "Customers count by Package (active)",
        description: "How many distinct active customers are subscribed to each package.",
        supportsTime: false,
        defaultBucket: "month",
        requires: ["Customer", "Subscription", "Package"],
        chartShape: { kind: "category_compare", groups: true },
        spec: () => ({
          metric: "customers_count",
          distinct: true,
          entity: "Customer",
          activeOnly: true,
          joinPath: ["Subscription", "Package"],
          groupBy: [{ model: "Package", fieldHint: "name" }],
        }),
        sentence: () =>
          "Show me the count of active customers, grouped by the package they are subscribed to.",
      },
      {
        id: "subscriptions_count_group_by_package",
        title: "Subscriptions count by Package (active)",
        description: "Counts active subscriptions per package.",
        supportsTime: false,
        defaultBucket: "month",
        requires: ["Subscription", "Package"],
        chartShape: { kind: "category_compare", groups: true },
        spec: () => ({
          metric: "subscriptions_count",
          entity: "Subscription",
          activeOnly: true,
          joinPath: ["Package"],
          groupBy: [{ model: "Package", fieldHint: "name" }],
        }),
        sentence: () => "Show me the count of active subscriptions, grouped by package.",
      },
      {
        id: "revenue_total_by_package_timeseries",
        title: "Total revenue by Package over time",
        description: "Total payments attributed to each package over time (weekly/monthly/yearly).",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Payment", "Subscription", "Package"],
        chartShape: { kind: "timeseries", groups: true },
        spec: (opts) => ({
          metric: "revenue_sum",
          entity: "Payment",
          valueFieldHint: "amount",
          timeBucket: opts.bucket,
          range: opts.range,
          joinPath: ["Subscription", "Package"],
          groupBy: [{ model: "Package", fieldHint: "name" }],
        }),
        sentence: (opts) =>
          `Show me the total revenue per package ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "revenue_total_timeseries",
        title: "Total revenue over time",
        description: "Total payments received per week/month/year.",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Payment"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "revenue_sum",
          entity: "Payment",
          valueFieldHint: "amount",
          timeBucket: opts.bucket,
          range: opts.range,
        }),
        sentence: (opts) =>
          `Show me total revenue ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "avg_amount_per_customer_timeseries",
        title: "Average revenue per Customer over time",
        description: "Average amount per customer per week/month/year.",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Payment", "Customer"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "avg_amount_per_customer",
          entity: "Payment",
          valueFieldHint: "amount",
          timeBucket: opts.bucket,
          range: opts.range,
          per: "Customer",
        }),
        sentence: (opts) =>
          `Show me the average revenue per customer ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "revenue_by_package_share_snapshot",
        title: "Revenue share by Package (snapshot)",
        description: "Percent of total revenue contributed by each package (top packages).",
        supportsTime: false,
        defaultBucket: "month",
        requires: ["Payment", "Subscription", "Package"],
        chartShape: { kind: "category_share", groups: true },
        spec: () => ({
          metric: "revenue_share_by_package",
          entity: "Payment",
          valueFieldHint: "amount",
          joinPath: ["Subscription", "Package"],
          groupBy: [{ model: "Package", fieldHint: "name" }],
          asPercent: true,
          topN: 10,
        }),
        sentence: () =>
          "Show me the revenue share by package (percent of total revenue), top packages first.",
      },

      // ---------------- NEW: 10 more options ----------------

      {
        id: "new_customers_timeseries",
        title: "New customers over time",
        description:
          "Counts new customers created per week/month/year (requires a createdAt/created_date field on Customer).",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Customer"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "customers_new_count",
          entity: "Customer",
          timeBucket: opts.bucket,
          range: opts.range,
          timeFieldHint: "created",
        }),
        sentence: (opts) =>
          `Show me how many new customers we got ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "active_customers_timeseries",
        title: "Active customers over time",
        description:
          "Distinct customers with an active subscription per week/month/year (computed snapshot per bucket).",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Customer", "Subscription"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "customers_active_count",
          entity: "Customer",
          distinct: true,
          timeBucket: opts.bucket,
          range: opts.range,
          joinPath: ["Subscription"],
          activeOnly: true,
        }),
        sentence: (opts) =>
          `Show me how many active customers we had ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "active_subscriptions_timeseries",
        title: "Active subscriptions over time",
        description: "Counts active subscriptions per week/month/year (computed snapshot per bucket).",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Subscription"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "subscriptions_active_count",
          entity: "Subscription",
          activeOnly: true,
          timeBucket: opts.bucket,
          range: opts.range,
        }),
        sentence: (opts) =>
          `Show me how many active subscriptions we had ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "cancellations_timeseries",
        title: "Cancellations over time",
        description:
          "Counts canceled subscriptions per week/month/year (requires canceledAt/canceled_date on Subscription).",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Subscription"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "subscriptions_canceled_count",
          entity: "Subscription",
          timeBucket: opts.bucket,
          range: opts.range,
          timeFieldHint: "canceled",
          statusHint: "canceled",
        }),
        sentence: (opts) =>
          `Show me how many subscriptions were canceled ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "churn_rate_timeseries",
        title: "Churn rate over time",
        description:
          "Churn rate per bucket = cancellations / starting active base (approx). Needs Subscription status dates.",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Subscription"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "churn_rate",
          entity: "Subscription",
          timeBucket: opts.bucket,
          range: opts.range,
          asPercent: true,
          numerator: "subscriptions_canceled_count",
          denominator: "subscriptions_active_base",
        }),
        sentence: (opts) =>
          `Show me churn rate ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "net_growth_subscriptions_timeseries",
        title: "Net subscription growth over time",
        description:
          "Net growth per bucket = new subscriptions - cancellations (needs createdAt/canceledAt on Subscription).",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Subscription"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "subscriptions_net_growth",
          entity: "Subscription",
          timeBucket: opts.bucket,
          range: opts.range,
          addends: [
            { metric: "subscriptions_new_count", sign: +1, timeFieldHint: "created" },
            { metric: "subscriptions_canceled_count", sign: -1, timeFieldHint: "canceled" },
          ],
        }),
        sentence: (opts) =>
          `Show me net subscription growth ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "mrr_total_timeseries",
        title: "MRR over time",
        description:
          "Monthly recurring revenue estimate over time. Typically derived from active subscriptions × package price.",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Subscription", "Package"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "mrr_total",
          entity: "Subscription",
          timeBucket: opts.bucket,
          range: opts.range,
          activeOnly: true,
          joinPath: ["Package"],
          valueFieldHint: "price",
        }),
        sentence: (opts) =>
          `Show me estimated MRR ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "mrr_by_package_timeseries",
        title: "MRR by Package over time",
        description: "MRR per package over time (composition). Great for stacked area or stacked bars.",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Subscription", "Package"],
        chartShape: { kind: "timeseries", groups: true },
        spec: (opts) => ({
          metric: "mrr_total",
          entity: "Subscription",
          timeBucket: opts.bucket,
          range: opts.range,
          activeOnly: true,
          joinPath: ["Package"],
          valueFieldHint: "price",
          groupBy: [{ model: "Package", fieldHint: "name" }],
        }),
        sentence: (opts) =>
          `Show me estimated MRR by package ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "arpu_timeseries",
        title: "ARPU over time",
        description: "Average revenue per user per bucket (revenue / active customers). Often shown as a line.",
        supportsTime: true,
        defaultBucket: "month",
        requires: ["Payment", "Customer", "Subscription"],
        chartShape: { kind: "timeseries", groups: false },
        spec: (opts) => ({
          metric: "arpu",
          entity: "Payment",
          valueFieldHint: "amount",
          timeBucket: opts.bucket,
          range: opts.range,
          asCurrency: true,
          per: "Customer",
          activeOnly: true,
          joinPath: ["Subscription", "Customer"],
        }),
        sentence: (opts) =>
          `Show me ARPU ${opts.bucketLabel.toLowerCase()} for the ${opts.rangeLabel.toLowerCase()}.`,
      },
      {
        id: "ltv_by_package_snapshot",
        title: "Estimated LTV by Package (snapshot)",
        description: "Rough LTV estimate per package (e.g., ARPU / churn). Useful for comparing packages.",
        supportsTime: false,
        defaultBucket: "month",
        requires: ["Payment", "Subscription", "Package"],
        chartShape: { kind: "category_compare", groups: true },
        spec: () => ({
          metric: "ltv_estimate_by_package",
          entity: "Package",
          joinPath: ["Subscription", "Payment"],
          valueFieldHint: "amount",
          groupBy: [{ model: "Package", fieldHint: "name" }],
          formulaHint: "arpu_over_churn",
        }),
        sentence: () =>
          "Show me an estimated LTV per package (rough comparison based on revenue and churn).",
      },
      {
        id: "top_customers_revenue_snapshot",
        title: "Top customers by revenue (snapshot)",
        description: "Ranks customers by total revenue (sum of payments).",
        supportsTime: false,
        defaultBucket: "month",
        requires: ["Payment", "Customer"],
        chartShape: { kind: "category_compare", groups: true },
        spec: () => ({
          metric: "revenue_sum",
          entity: "Payment",
          valueFieldHint: "amount",
          joinPath: ["Customer"],
          groupBy: [{ model: "Customer", fieldHint: "email" }],
          topN: 20,
          order: "desc",
        }),
        sentence: () => "Show me the top customers ranked by total revenue.",
      },
    ];

    return base.map((r) => ({
      ...r,
      enabled: schema ? has(...r.requires) : true,
      disabledReason: schema
        ? `Missing required tables: ${r.requires.filter((x) => !modelSet.has(x)).join(", ")}`
        : "",
    }));
  }, [schema, modelSet]);

  // ---------------- state ----------------
  const [recipeId, setRecipeId] = useState(RECIPES[0]?.id || "");
  const [bucket, setBucket] = useState("month");
  const [range, setRange] = useState("10y");

  // popup state
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState("");
  const [result, setResult] = useState(null); // whatever onRun returns

  // keep selected recipe valid
  useEffect(() => {
    const cur = RECIPES.find((r) => r.id === recipeId);
    if (cur && cur.enabled) return;
    const firstEnabled = RECIPES.find((r) => r.enabled);
    if (firstEnabled) setRecipeId(firstEnabled.id);
  }, [RECIPES, recipeId]);

  const selectedRecipe = useMemo(() => RECIPES.find((r) => r.id === recipeId) || null, [RECIPES, recipeId]);

  // don’t clobber bucket if already set
  useEffect(() => {
    if (!selectedRecipe?.supportsTime) return;
    setBucket((prev) => prev || selectedRecipe.defaultBucket || "month");
  }, [selectedRecipe?.id]);

  const bucketLabel = useMemo(() => BUCKETS.find((b) => b.id === bucket)?.label || bucket, [BUCKETS, bucket]);
  const rangeLabel = useMemo(() => RANGES.find((r) => r.id === range)?.label || range, [RANGES, range]);

  const sentence = useMemo(() => {
    if (!selectedRecipe) return "Select an analysis.";
    const opts = { bucket, range, bucketLabel, rangeLabel };
    return selectedRecipe.sentence(opts);
  }, [selectedRecipe, bucket, range, bucketLabel, rangeLabel]);

  const baseQuerySpec = useMemo(() => {
    if (!selectedRecipe) return null;
    const opts = { bucket, range, bucketLabel, rangeLabel };
    return selectedRecipe.spec(opts);
  }, [selectedRecipe, bucket, range, bucketLabel, rangeLabel]);

  // ---------------- chart dropdown (recommended) ----------------
  const chartOptions = useMemo(() => {
    const opts = [];
    const push = (id, label) => {
      if (opts.some((x) => x.id === id)) return;
      opts.push({ id, label });
    };

    if (!selectedRecipe) return opts;

    const shape = selectedRecipe.chartShape || { kind: "category_compare" };

    if (shape.kind === "timeseries" && !shape.groups) {
      push("line", "Line (time series)");
      push("area", "Area (filled line)");
      push("scatter", "Scatter (points over time)");
      push("bar_time", "Bar (time on x-axis)");
      push("step", "Step line");
      push("line_smooth", "Line with smoothing (trend)");
      return opts;
    }

    if (shape.kind === "timeseries" && shape.groups) {
      push("line_multi", "Multi-line (one per group)");
      push("area_stack", "Stacked area (composition over time)");
      push("bar_stack_time", "Stacked bar (composition over time)");
      push("heatmap_time_group", "Heatmap (time vs group)");
      push("table", "Table (time × group)");
      return opts;
    }

    if (shape.kind === "category_share") {
      push("pie", "Pie (share of total)");
      push("donut", "Donut (share of total)");
      push("treemap", "Treemap");
      push("bar", "Bar (share per category)");
      push("table", "Table (ranked list)");
      return opts;
    }

    push("bar", "Bar (compare categories)");
    push("horizontal_bar", "Horizontal bar (many categories)");
    push("table", "Table (ranked list)");
    push("pie", "Pie (share of total)");
    push("donut", "Donut (share of total)");
    push("treemap", "Treemap");
    return opts;
  }, [selectedRecipe]);

  const [chartId, setChartId] = useState("bar");

  // keep current chart if still valid
  useEffect(() => {
    if (chartOptions.some((c) => c.id === chartId)) return;
    setChartId(chartOptions[0]?.id || "bar");
  }, [chartOptions, chartId]);

  const querySpec = useMemo(() => {
    if (!baseQuerySpec) return null;
    return { ...baseQuerySpec, chartKey: chartId, range, bucket };
  }, [baseQuerySpec, chartId, range, bucket]);

  const shownAs = useMemo(() => {
    const label = chartOptions.find((c) => c.id === chartId)?.label || "Chart";
    return label.toLowerCase();
  }, [chartOptions, chartId]);

  // notify parent (unchanged)
  useEffect(() => {
    if (!selectedRecipe || !querySpec) return;
    onChange?.({
      recipeId: selectedRecipe.id,
      querySpec,
      sentence: `${sentence} (shown as: ${shownAs})`,
    });
  }, [selectedRecipe?.id, querySpec, sentence, shownAs, onChange]);

  const runPayload = useMemo(() => {
    if (!selectedRecipe || !querySpec) return null;
    return {
      recipeId: selectedRecipe.id,
      querySpec,
      sentence: `${sentence} (shown as: ${shownAs})`,
      chartKey: chartId,
    };
  }, [selectedRecipe, querySpec, sentence, shownAs, chartId]);

  // ---------------- plotly helpers (fallback) ----------------
  function buildFallbackPlotly(res, chartKey) {
    const rows = Array.isArray(res?.rows) ? res.rows : [];
    if (!rows.length) return null;

    const xKey = res?.xKey || "bucket";
    const yKey = res?.yKey || "value";
    const seriesKey = res?.seriesKey || "group";

    const title = res?.title || "Analysis";

    // table rendering
    if (chartKey === "table") {
      const cols = Object.keys(rows[0] || {});
      return {
        data: [
          {
            type: "table",
            header: { values: cols, align: "left" },
            cells: { values: cols.map((c) => rows.map((r) => r?.[c])) , align: "left" },
          },
        ],
        layout: { title, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)" },
        config: { displayModeBar: true, responsive: true },
      };
    }

    const hasSeries = rows.some((r) => r?.[seriesKey] != null);

    // group -> traces
    let traces = [];
    if (hasSeries) {
      const groups = Array.from(new Set(rows.map((r) => String(r?.[seriesKey]))));
      traces = groups.map((g) => {
        const rr = rows.filter((r) => String(r?.[seriesKey]) === g);
        const x = rr.map((r) => r?.[xKey]);
        const y = rr.map((r) => Number(r?.[yKey] ?? 0));
        const t = { name: g };

        // map chartKey -> trace type/mode
        if (chartKey.includes("bar")) return { ...t, type: "bar", x, y };
        if (chartKey.includes("scatter")) return { ...t, type: "scatter", mode: "markers", x, y };
        if (chartKey.includes("area")) return { ...t, type: "scatter", mode: "lines", fill: "tozeroy", x, y };
        return { ...t, type: "scatter", mode: "lines", x, y };
      });
    } else {
      const x = rows.map((r) => r?.[xKey]);
      const y = rows.map((r) => Number(r?.[yKey] ?? 0));

      if (chartKey === "pie" || chartKey === "donut") {
        return {
          data: [
            {
              type: "pie",
              labels: x,
              values: y,
              hole: chartKey === "donut" ? 0.45 : 0,
            },
          ],
          layout: { title, paper_bgcolor: "rgba(0,0,0,0)" },
          config: { displayModeBar: true, responsive: true },
        };
      }

      if (chartKey.includes("bar")) {
        traces = [{ type: "bar", x, y }];
      } else if (chartKey.includes("scatter")) {
        traces = [{ type: "scatter", mode: "markers", x, y }];
      } else if (chartKey.includes("area")) {
        traces = [{ type: "scatter", mode: "lines", fill: "tozeroy", x, y }];
      } else {
        traces = [{ type: "scatter", mode: "lines", x, y }];
      }
    }

    return {
      data: traces,
      layout: {
        title,
        margin: { l: 50, r: 30, t: 50, b: 45 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { family: 'ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace', color: "#39ff14" },
        xaxis: { gridcolor: "rgba(57,255,20,0.12)", zerolinecolor: "rgba(57,255,20,0.18)" },
        yaxis: { gridcolor: "rgba(57,255,20,0.12)", zerolinecolor: "rgba(57,255,20,0.18)" },
      },
      config: { displayModeBar: true, responsive: true },
    };
  }

  // ---------------- UI styles ----------------
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
    cursor: selectedRecipe?.enabled ? "pointer" : "not-allowed",
    opacity: selectedRecipe?.enabled ? 1 : 0.65,
  };

  const modalOverlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  };

  const modalCard = {
    width: "min(1100px, 96vw)",
    maxHeight: "92vh",
    overflow: "hidden",
    borderRadius: 14,
    border: "1px solid rgba(57,255,20,0.18)",
    background: "rgba(0,0,0,0.88)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
  };

  const modalHeader = {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(57,255,20,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    color: "#39ff14",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  };

  const modalBody = {
    padding: 12,
    overflow: "auto",
    maxHeight: "calc(92vh - 54px)",
  };

  const closeBtn = {
    border: "1px solid rgba(57,255,20,0.22)",
    background: "rgba(0,0,0,0.65)",
    color: "#39ff14",
    borderRadius: 10,
    padding: "7px 10px",
    cursor: "pointer",
    fontWeight: 900,
  };

  const hasRecipes = RECIPES.length > 0;

  async function handleRun() {
    console.log("✅ handleRun fired");
    if (!selectedRecipe?.enabled) return;
    if (!runPayload) return;

    // open popup immediately
    setOpen(true);
    setRunning(true);
    setRunErr("");
    setResult(null);

    try {
      if (!onRun) throw new Error("onRun is not connected. Pass onRun from AnalyticsPage.jsx.");

      const res = await onRun(runPayload);

      // Allow onRun to return either:
      // 1) { plotly: {data,layout,config}, title? }
      // 2) { rows: [...], xKey?, yKey?, seriesKey? }
      // 3) { ok:false, error:"..." }
      if (res?.ok === false) throw new Error(res?.error || "Analysis failed.");

      setResult(res || { ok: true });
    } catch (e) {
      console.error(e);
      setRunErr(String(e?.message || e));
    } finally {
      setRunning(false);
    }
  }

  function plotlyBundle() {
    if (!result) return null;
    if (result?.plotly?.data) {
      const p = result.plotly;
      return {
        data: p.data,
        layout: {
          ...(p.layout || {}),
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: p.layout?.font || {
            family: 'ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace',
            color: "#39ff14",
          },
        },
        config: { responsive: true, displayModeBar: true, ...(p.config || {}) },
      };
    }
    const fallback = buildFallbackPlotly(result, chartId);
    return fallback;
  }

  const plot = plotlyBundle();

  return (
    <div className="entity-card" style={{ marginTop: 14 }}>
      <details open>
        <summary style={{ cursor: "pointer", fontWeight: 900, fontSize: 13, color: "#39ff14" }}>
          Quick Analytics Recipes
        </summary>

        <div className="entity-muted" style={{ marginTop: 8 }}>
          Pick a common analysis. We auto-select valid Plotly chart types.
        </div>

        {!hasRecipes ? (
          <div className="entity-error" style={{ marginTop: 10 }}>
            No recipes defined. Add recipes to the RECIPES list in AnalyticsRecipePicker.jsx.
          </div>
        ) : (
          <>
            <div style={labelStyle}>Choose an analysis</div>
            <select style={selectStyle} value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
              {RECIPES.map((r) => (
                <option key={r.id} value={r.id} disabled={!r.enabled}>
                  {r.enabled ? r.title : `⛔ ${r.title}`}
                </option>
              ))}
            </select>

            {selectedRecipe && !selectedRecipe.enabled ? (
              <div className="entity-error" style={{ marginTop: 10 }}>
                {selectedRecipe.disabledReason || "This recipe is unavailable with the current schema."}
              </div>
            ) : null}

            {selectedRecipe ? (
              <div className="entity-muted" style={{ marginTop: 10 }}>
                {selectedRecipe.description}
              </div>
            ) : null}

            {selectedRecipe?.supportsTime ? (
              <>
                <div style={labelStyle}>Time range</div>
                <select style={selectStyle} value={range} onChange={(e) => setRange(e.target.value)}>
                  {RANGES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>

                <div style={labelStyle}>Time grouping</div>
                <select style={selectStyle} value={bucket} onChange={(e) => setBucket(e.target.value)}>
                  {BUCKETS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <div style={labelStyle}>Recommended Plotly chart</div>
            <select style={selectStyle} value={chartId} onChange={(e) => setChartId(e.target.value)}>
              {chartOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

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
                {sentence} <span style={{ opacity: 0.9 }}>(shown as: {shownAs})</span>
              </div>
            </div>

            <button style={btnStyle} onClick={handleRun} disabled={!selectedRecipe?.enabled}>
              Run This Analysis
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
                {JSON.stringify({ recipeId: selectedRecipe?.id, querySpec }, null, 2)}
              </pre>
            </details>
          </>
        )}
      </details>

      {/* ---------------- POPUP ---------------- */}
      {open ? (
        <div
          style={modalOverlay}
          onMouseDown={(e) => {
            // click outside closes
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div style={modalCard}>
            <div style={modalHeader}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 900 }}>
                  {selectedRecipe?.title || "Analysis"}
                  {running ? "  •  running…" : ""}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  {sentence} (shown as: {shownAs})
                </div>
              </div>

              <button
                style={closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Close analysis popup"
                title="Close"
              >
                Close
              </button>
            </div>

            <div style={modalBody}>
              {runErr ? (
                <div
                  className="entity-error"
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,80,80,0.35)",
                    background: "rgba(80,0,0,0.25)",
                  }}
                >
                  {runErr}
                </div>
              ) : running ? (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid rgba(57,255,20,0.18)",
                    background: "rgba(0,0,0,0.55)",
                    color: "rgba(57,255,20,0.92)",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  Fetching data… rendering Plotly…
                </div>
              ) : plot ? (
                <Plot
                  data={plot.data}
                  layout={{
                    ...(plot.layout || {}),
                    autosize: true,
                  }}
                  config={plot.config || { responsive: true, displayModeBar: true }}
                  style={{ width: "100%", height: "70vh" }}
                  useResizeHandler
                />
              ) : (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid rgba(57,255,20,0.18)",
                    background: "rgba(0,0,0,0.55)",
                    color: "rgba(57,255,20,0.92)",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  No data returned.
                </div>
              )}

              {/* optional debug view */}
              {result ? (
                <details style={{ marginTop: 12, opacity: 0.9 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 900, fontSize: 12 }}>
                    Debug result
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
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
