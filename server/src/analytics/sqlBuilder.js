import pg from "pg";
const { Pool } = pg;

// Postgres pool (DATABASE_URL comes from docker-compose)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------------------
// Fixed schema constants (from your schema.prisma)
// ---------------------
const T = {
  Customer: `"Customer"`,
  Package: `"Package"`,
  Subscription: `"Subscription"`,
  Payment: `"Payment"`,
};

const C = {
  Customer: { pk: `"customerID"` },
  Package: { pk: `"packageID"`, monthlyCost: `"monthlyCost"`, annualCost: `"annualCost"` },
  Subscription: {
    pk: `"subscriptionID"`,
    customerID: `"customerID"`,
    packageID: `"packageID"`,
    status: `"status"`,
    endDate: `"endDate"`,
    price: `"price"`,
  },
  Payment: {
    pk: `"paymentID"`,
    subscriptionID: `"subscriptionID"`,
    dueDate: `"dueDate"`,
    paidAt: `"paidAt"`,
    status: `"status"`,
  },
};

// ✅ Computed package label (NO DB change)
function packageLabelExpr(pkgAlias = "p") {
  return `('Monthly: ' || ${pkgAlias}.${C.Package.monthlyCost} || ' / Annual: ' || ${pkgAlias}.${C.Package.annualCost})`;
}

// ✅ Active subscription filter
function activeSubscriptionWhere(subAlias = "s") {
  return `${subAlias}.${C.Subscription.status} = 'ACTIVE'`;
}

function rangeToInterval(range) {
  switch (range) {
    case "10y":
      return "10 years";
    case "5y":
      return "5 years";
    case "12m":
      return "12 months";
    case "6m":
      return "6 months";
    default:
      return "10 years";
  }
}

function bucketToDateTrunc(bucket) {
  if (bucket === "day") return "day";
  if (bucket === "week") return "week";
  if (bucket === "year") return "year";
  return "month";
}

/**
 * Revenue in YOUR schema:
 * - Payment has no amount
 * - Subscription has price
 * So: revenue per payment event = Subscription.price
 * Use paidAt when available, else dueDate.
 */
function paymentTimeExpr(pAlias = "pay") {
  return `COALESCE(${pAlias}.${C.Payment.paidAt}, ${pAlias}.${C.Payment.dueDate})`;
}

export function buildSql(querySpec) {
  if (!querySpec || !querySpec.metric) throw new Error("Missing querySpec.metric");

  const metric = querySpec.metric;

  const range = querySpec.range || "10y";
  const bucket = querySpec.bucket || querySpec.timeBucket || "month";
  const truncUnit = bucketToDateTrunc(bucket);
  const startExpr = `NOW() - INTERVAL '${rangeToInterval(range)}'`;

  // 1) customers_count grouped by Package
  if (
    metric === "customers_count" &&
    Array.isArray(querySpec.joinPath) &&
    querySpec.joinPath.join(",") === "Subscription,Package"
  ) {
    const where = [];
    if (querySpec.activeOnly) where.push(activeSubscriptionWhere("s"));
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const pkgLabel = packageLabelExpr("p");

    return `
      SELECT
        ${pkgLabel} AS package_name,
        COUNT(DISTINCT c.${C.Customer.pk})::int AS customers_count
      FROM ${T.Customer} c
      JOIN ${T.Subscription} s ON s.${C.Subscription.customerID} = c.${C.Customer.pk}
      JOIN ${T.Package} p ON p.${C.Package.pk} = s.${C.Subscription.packageID}
      ${whereSql}
      GROUP BY 1
      ORDER BY customers_count DESC
      LIMIT 500;
    `;
  }

  // 2) subscriptions_count grouped by Package
  if (
    metric === "subscriptions_count" &&
    Array.isArray(querySpec.joinPath) &&
    querySpec.joinPath.join(",") === "Package"
  ) {
    const where = [];
    if (querySpec.activeOnly) where.push(activeSubscriptionWhere("s"));
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const pkgLabel = packageLabelExpr("p");

    return `
      SELECT
        ${pkgLabel} AS package_name,
        COUNT(s.${C.Subscription.pk})::int AS subscriptions_count
      FROM ${T.Subscription} s
      JOIN ${T.Package} p ON p.${C.Package.pk} = s.${C.Subscription.packageID}
      ${whereSql}
      GROUP BY 1
      ORDER BY subscriptions_count DESC
      LIMIT 500;
    `;
  }

  // 3) revenue_sum total over time
  if (metric === "revenue_sum" && querySpec.entity === "Payment" && !querySpec.groupBy && !querySpec.joinPath) {
    const tExpr = paymentTimeExpr("pay");

    return `
      SELECT
        date_trunc('${truncUnit}', ${tExpr}) AS bucket,
        COALESCE(SUM(s.${C.Subscription.price}), 0)::float AS revenue
      FROM ${T.Payment} pay
      JOIN ${T.Subscription} s ON s.${C.Subscription.pk} = pay.${C.Payment.subscriptionID}
      WHERE ${tExpr} >= ${startExpr}
      GROUP BY 1
      ORDER BY 1 ASC
      LIMIT 5000;
    `;
  }

  // 4) revenue_sum by Package over time
  if (
    metric === "revenue_sum" &&
    querySpec.entity === "Payment" &&
    Array.isArray(querySpec.joinPath) &&
    querySpec.joinPath.join(",") === "Subscription,Package"
  ) {
    const tExpr = paymentTimeExpr("pay");
    const pkgLabel = packageLabelExpr("p");

    const where = [`${tExpr} >= ${startExpr}`];
    if (querySpec.activeOnly) where.push(activeSubscriptionWhere("s"));
    const whereSql = `WHERE ${where.join(" AND ")}`;

    return `
      SELECT
        date_trunc('${truncUnit}', ${tExpr}) AS bucket,
        ${pkgLabel} AS package_name,
        COALESCE(SUM(s.${C.Subscription.price}), 0)::float AS revenue
      FROM ${T.Payment} pay
      JOIN ${T.Subscription} s ON s.${C.Subscription.pk} = pay.${C.Payment.subscriptionID}
      JOIN ${T.Package} p ON p.${C.Package.pk} = s.${C.Subscription.packageID}
      ${whereSql}
      GROUP BY 1, 2
      ORDER BY 1 ASC, revenue DESC
      LIMIT 20000;
    `;
  }

  // 5) revenue_share_by_package snapshot
  if (metric === "revenue_share_by_package") {
    const tExpr = paymentTimeExpr("pay");
    const pkgLabel = packageLabelExpr("p");

    const where = [];
    if (querySpec.range) where.push(`${tExpr} >= ${startExpr}`);
    if (querySpec.activeOnly) where.push(activeSubscriptionWhere("s"));
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const topN = Number(querySpec.topN || 10);

    return `
      WITH by_pkg AS (
        SELECT
          ${pkgLabel} AS package_name,
          COALESCE(SUM(s.${C.Subscription.price}), 0)::float AS revenue
        FROM ${T.Payment} pay
        JOIN ${T.Subscription} s ON s.${C.Subscription.pk} = pay.${C.Payment.subscriptionID}
        JOIN ${T.Package} p ON p.${C.Package.pk} = s.${C.Subscription.packageID}
        ${whereSql}
        GROUP BY 1
      ),
      tot AS (
        SELECT COALESCE(SUM(revenue), 0)::float AS total_revenue FROM by_pkg
      )
      SELECT
        b.package_name,
        b.revenue,
        CASE WHEN t.total_revenue = 0 THEN 0 ELSE (b.revenue / t.total_revenue) * 100 END AS pct
      FROM by_pkg b
      CROSS JOIN tot t
      ORDER BY b.revenue DESC
      LIMIT ${topN};
    `;
  }

  // 6) avg_amount_per_customer time series
  if (metric === "avg_amount_per_customer") {
    const tExpr = paymentTimeExpr("pay");

    return `
      SELECT
        date_trunc('${truncUnit}', ${tExpr}) AS bucket,
        CASE
          WHEN COUNT(DISTINCT s.${C.Subscription.customerID}) = 0 THEN 0
          ELSE (SUM(s.${C.Subscription.price})::float / COUNT(DISTINCT s.${C.Subscription.customerID}))
        END AS avg_per_customer
      FROM ${T.Payment} pay
      JOIN ${T.Subscription} s ON s.${C.Subscription.pk} = pay.${C.Payment.subscriptionID}
      WHERE ${tExpr} >= ${startExpr}
      GROUP BY 1
      ORDER BY 1 ASC
      LIMIT 5000;
    `;
  }

  throw new Error(`No SQL builder for metric=${metric}. querySpec=${JSON.stringify(querySpec)}`);
}
