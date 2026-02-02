// server/src/analytics/sql/activePackagesSnapshot.js

/**
 * Builds SQL for: count of DISTINCT packages that appear in active subscriptions
 * at the start of each bucket (weekly/monthly/yearly), going back N years.
 *
 * "Active at bucket_start" means:
 *   startDate <= bucket_start
 *   AND (endDate IS NULL OR endDate > bucket_start)
 */
export function buildActivePackagesSnapshotSQL(basis = "monthly", yearsBack = 10) {
  const b = String(basis || "").toLowerCase();

  const allowed = new Set(["weekly", "monthly", "yearly"]);
  if (!allowed.has(b)) {
    throw new Error(`Invalid basis. Use one of: weekly, monthly, yearly. Got: ${basis}`);
  }

  const unit = b === "weekly" ? "week" : b === "yearly" ? "year" : "month";
  const step = b === "weekly" ? "1 week" : b === "yearly" ? "1 year" : "1 month";

  return `
WITH buckets AS (
  SELECT generate_series(
    date_trunc('${unit}', CURRENT_DATE) - interval '${yearsBack} years',
    date_trunc('${unit}', CURRENT_DATE),
    interval '${step}'
  )::date AS bucket_start
)
SELECT
  b.bucket_start,
  COUNT(DISTINCT s."packageID")::int AS active_packages
FROM buckets b
LEFT JOIN "Subscription" s
  ON s."startDate" <= b.bucket_start
 AND (s."endDate" IS NULL OR s."endDate" > b.bucket_start)
GROUP BY b.bucket_start
ORDER BY b.bucket_start;
`.trim();
}
