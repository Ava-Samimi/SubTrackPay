/**
 * Factory that returns the async handler used by AnalyticsLeftShow.
 * It fetches the dataset, then builds a Plotly chart spec and opens the popup.
 */
export function createHandleShowClick({
  // metric fetchers
  fetchActiveSubscriptionsSnapshot,
  fetchActiveCustomersSnapshot,
  fetchActivePackagesSnapshot,
  fetchAvgAmountPaidAssumed,

  // ✅ NEW: snapshot by package (no basis)
  fetchActiveSubscriptionsByPackageSnapshot,

  // setters from AnalyticsPage
  setSnapshotLoading,
  setSnapshotError,
  setSnapshotRows,

  setSelectedAnalyticsName,
  setPopupMode, // "rows" | "chart" | "plot"
  setShowChartPopup,

  // plotly spec setter from AnalyticsPage
  setPopupPlot, // expects { data, layout, config }
}) {
  // Choose Y field based on metric
  function getYKey(metric) {
    if (metric === "active_subscriptions") return "active_subscriptions";
    if (metric === "active_customers") return "active_customers";
    if (metric === "active_packages") return "active_packages";
    if (metric === "avg_amount_paid_assumed") return "avg_amount_paid";
    return null;
  }

  function getTitle(metric, basis) {
    if (metric === "active_subscriptions") return `Active Subscriptions (${basis})`;
    if (metric === "active_customers") return `Active Customers (${basis})`;
    if (metric === "active_packages") return `Active Packages (${basis})`;
    if (metric === "avg_amount_paid_assumed") return `Avg Amount Paid (${basis})`;

    // ✅ NEW
    if (metric === "active_subscriptions_by_package") return "Active Subscriptions by Package (Now)";
    if (metric === "active_subscriptions_by_package_spider")
      return "Active Subscriptions by Package (SPIDER)";

    return basis ? `Result (${basis})` : "Result";
  }

  // Some metrics allow only certain bases
  function normalizeBasis(metric, basis) {
    // ✅ basis irrelevant for this one
    if (metric === "active_subscriptions_by_package") return null;
    if (metric === "active_subscriptions_by_package_spider") return null;

    const b = String(basis || "").toLowerCase();
    if (metric === "avg_amount_paid_assumed") {
      // Only monthly/yearly for this metric
      if (b === "weekly") return "monthly";
      return b === "yearly" ? "yearly" : "monthly";
    }
    // default: weekly/monthly/yearly allowed
    if (b === "weekly" || b === "yearly" || b === "monthly") return b;
    return "monthly";
  }

  function buildLinePlotSpec({ rows, metric, basis }) {
    const xKey = "bucket_start";
    const yKey = getYKey(metric) || "value";

    const x = [];
    const y = [];

    for (const r of rows || []) {
      x.push(String(r?.[xKey] ?? ""));
      const v = r?.[yKey];
      y.push(v == null || v === "" ? null : Number(v));
    }

    const title = getTitle(metric, basis);

    // Limit the number of labels on the x-axis to avoid clutter
    const step = Math.ceil(x.length / 10); // Adjust this number to control density of labels
    const filteredX = x.filter((_, index) => index % step === 0); // Only show every `step`th label
    const filteredLabels = filteredX; // Could also add custom text for labels if needed

    return {
      data: [
        {
          type: "scatter",
          mode: "lines+markers",
          x,
          y,
          name: title,
        },
      ],
      layout: {
        title: { text: title },
        paper_bgcolor: "#000",
        plot_bgcolor: "#000",
        font: { color: "#39ff14" },
        xaxis: {
          title: "packageID",
          type: "category",

          // Remove x-axis labels entirely
          tickmode: "array",
          tickvals: [], // Empty array to remove labels
          ticktext: [], // Empty array to remove labels

          tickangle: 0, // or -45 if you want tighter spacing
          automargin: true,

          gridcolor: "rgba(57, 255, 20, 0.12)",
          zerolinecolor: "rgba(57, 255, 20, 0.18)",
        },
        yaxis: {
          title: yKey,
          gridcolor: "rgba(57, 255, 20, 0.12)",
          zerolinecolor: "rgba(57, 255, 20, 0.18)",
        },
        margin: { l: 55, r: 20, t: 50, b: 45 },
      },
      config: {
        displayModeBar: true,
        responsive: true,
      },
    };
  }

  /**
   * ✅ Bar chart for: active_subscriptions_by_package
   * rows: [{ packageID, subs, pct }]
   */
  function buildActiveSubsByPackageBarSpec({ rows }) {
    const x = [];
    const y = [];
    const text = [];

    for (const r of rows || []) {
      const pkg = r?.packageID;
      const subs = r?.subs;
      const pct = r?.pct;

      x.push(pkg == null ? "" : String(pkg));
      y.push(subs == null || subs === "" ? 0 : Number(subs));
      text.push(pct == null || pct === "" ? "" : `${Number(pct).toFixed(2)}%`);
    }

    const title = "Active Subscriptions by Package (Now)";

    return {
      data: [
        {
          type: "bar",
          x,
          y,
          text,
          textposition: "auto",
          name: "subs",
        },
      ],
      layout: {
        title: { text: title },
        paper_bgcolor: "#000",
        plot_bgcolor: "#000",
        font: { color: "#39ff14" },
        xaxis: {
          title: "packageID",
          gridcolor: "rgba(57, 255, 20, 0.12)",
          zerolinecolor: "rgba(57, 255, 20, 0.18)",
        },
        yaxis: {
          title: "active subscriptions",
          gridcolor: "rgba(57, 255, 20, 0.12)",
          zerolinecolor: "rgba(57, 255, 20, 0.18)",
        },
        margin: { l: 55, r: 20, t: 50, b: 55 },
      },
      config: {
        displayModeBar: true,
        responsive: true,
      },
    };
  }

  /**
   * ✅ Spider / Radar chart for: active_subscriptions_by_package_spider
   * Uses SAME rows as bar version: [{ packageID, subs, pct }]
   *
   * Distributes points evenly around the circle by using numeric degrees for theta,
   * then replacing tick labels with package labels (so user does NOT see degrees).
   */
  function buildActiveSubsByPackageSpiderSpec({ rows }) {
    const labels = [];
    const values = [];
    const hover = [];

    for (const row of rows || []) {
      const pkg = row?.packageID;
      const subs = row?.subs;
      const pct = row?.pct;

      const label = pkg == null ? "" : `Pkg ${String(pkg)}`;
      const val = subs == null || subs === "" ? 0 : Number(subs);

      if (!label) continue;
      if (!Number.isFinite(val)) continue;

      labels.push(label);
      values.push(val);

      const pctTxt = pct == null || pct === "" ? "" : `${Number(pct).toFixed(2)}%`;
      hover.push(
        pctTxt ? `${label}<br>Subs ${val}<br>${pctTxt}` : `${label}<br>Subs ${val}`
      );
    }

    const n = labels.length;
    const title = "Active Subscriptions by Package (SPIDER)";

    if (n === 0) {
      return {
        data: [],
        layout: {
          title: { text: title },
          paper_bgcolor: "#000",
          plot_bgcolor: "#000",
          font: { color: "#39ff14" },
          annotations: [
            { text: "No data", showarrow: false, font: { color: "#39ff14", size: 18 } },
          ],
        },
        config: { displayModeBar: true, responsive: true },
      };
    }

    // ✅ evenly spaced degrees for each package
    const thetaDeg = [];
    for (let i = 0; i < n; i++) thetaDeg.push((360 * i) / n);

    // ✅ close polygon
    const thetaClosed = [...thetaDeg, thetaDeg[0]];
    const rClosed = [...values, values[0]];
    const hoverClosed = [...hover, hover[0]];

    return {
      data: [
        {
          type: "scatterpolar",
          mode: "lines+markers",
          theta: thetaClosed, // numeric degrees internally
          r: rClosed,
          text: hoverClosed,
          hoverinfo: "text",
          name: "subs",
          fill: "toself",
          fillcolor: "rgba(255, 0, 0, 0.18)",
        },
      ],
      layout: {
        title: { text: title },
        paper_bgcolor: "#000",
        plot_bgcolor: "#000",
        font: { color: "#39ff14" },
        polar: {
          bgcolor: "#000",
          radialaxis: {
            visible: true,
            gridcolor: "rgba(57, 255, 20, 0.12)",
            zerolinecolor: "rgba(57, 255, 20, 0.18)",
            tickfont: { color: "#39ff14" },
            rangemode: "tozero",
          },
          angularaxis: {
            // ✅ show package labels at those degrees (hide degree labels)
            tickmode: "array",
            tickvals: thetaDeg,
            ticktext: labels,

            tickfont: { color: "#39ff14", size: 12 },
            gridcolor: "rgba(57, 255, 20, 0.12)",
            linecolor: "rgba(57, 255, 20, 0.18)",

            rotation: 90,
            direction: "clockwise",
          },
        },
        margin: { l: 55, r: 20, t: 50, b: 55 },
        showlegend: false,
      },
      config: {
        displayModeBar: true,
        responsive: true,
      },
    };
  }

  return async function handleShowClick(payload) {
    try {
      setSnapshotLoading(true);
      setSnapshotError("");
      setSnapshotRows([]);
      setPopupPlot?.(null);

      const metric = payload?.metric;
      const rawBasis = payload?.basis || "monthly";
      const basis = normalizeBasis(metric, rawBasis);

      let rows = [];

      if (metric === "active_subscriptions") {
        rows = await fetchActiveSubscriptionsSnapshot(basis);
      } else if (metric === "active_customers") {
        rows = await fetchActiveCustomersSnapshot(basis);
      } else if (metric === "active_packages") {
        rows = await fetchActivePackagesSnapshot(basis);
      } else if (metric === "avg_amount_paid_assumed") {
        rows = await fetchAvgAmountPaidAssumed(basis);
      } else if (
        metric === "active_subscriptions_by_package" ||
        metric === "active_subscriptions_by_package_spider"
      ) {
        // ✅ SAME DATA FETCH for both bar + spider
        rows = await fetchActiveSubscriptionsByPackageSnapshot();
      } else {
        throw new Error(`Unknown metric: ${metric}`);
      }

      const safeRows = Array.isArray(rows) ? rows : [];

      setSnapshotRows(safeRows);
      setSnapshotLoading(false);

      const title = getTitle(metric, basis || "");
      setSelectedAnalyticsName(title);

      // ✅ Choose plot type by metric
      const plotSpec =
        metric === "active_subscriptions_by_package"
          ? buildActiveSubsByPackageBarSpec({ rows: safeRows })
          : metric === "active_subscriptions_by_package_spider"
            ? buildActiveSubsByPackageSpiderSpec({ rows: safeRows })
            : buildLinePlotSpec({ rows: safeRows, metric, basis });

      setPopupPlot?.(plotSpec);
      setPopupMode("plot");
      setShowChartPopup(true);
    } catch (e) {
      console.error("Show handler failed:", e);
      setSnapshotError(e?.message || "Failed to load snapshot.");
      setSnapshotLoading(false);

      setSelectedAnalyticsName("Error");
      setPopupMode("rows");
      setShowChartPopup(true);
    }
  };
}
