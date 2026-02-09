import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const AnalyticsChart = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API}/api/data/package_percentages`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const arr = Array.isArray(json) ? json : [];

        if (!cancelled) {
          setRows(arr);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to load package_percentages:", e);
        if (!cancelled) {
          setErr("No data available");
          setRows([]);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    const categories = rows.map((pkg) => {
      const name = String(pkg.package_name || "").trim();
      if (name) return name;
      if (pkg.package_id != null) return `Package ${pkg.package_id}`;
      return "Package";
    });

    const percentages = rows.map((pkg) => Number(pkg.percentage) || 0);

    return [
      {
        type: "scatterpolar",
        r: percentages,
        theta: categories,
        fill: "toself",
        line: { color: "rgb(0, 255, 0)" },
        marker: { size: 8 },
      },
    ];
  }, [rows]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      {loading ? (
        <div>Loading...</div>
      ) : err || chartData.length === 0 ? (
        <div>{err || "No data available"}</div>
      ) : (
        <Plot
  data={chartData}
  layout={{
    title: { text: "Package Comparison", font: { color: "black" } },
    font: { color: "black" },
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 25],
        tickfont: { color: "black" },
      },
      angularaxis: { tickfont: { color: "black" } },
    },
    paper_bgcolor: "rgb(0, 128, 0)",
    plot_bgcolor: "rgb(0, 128, 0)",

    // optional (extra safety): prevents drag interactions
    dragmode: false,
  }}
  config={{
    responsive: true,

    // ✅ hides that toolbar completely
    displayModeBar: false,

    // ✅ makes the chart not clickable / not interactive (no zoom/pan/select/hover actions)
    staticPlot: true,

    // optional (extra safety)
    displaylogo: false,
  }}
/>

      )}
    </div>
  );
};

export default AnalyticsChart;
