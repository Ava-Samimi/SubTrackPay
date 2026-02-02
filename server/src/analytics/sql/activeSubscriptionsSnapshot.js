export function buildActiveSubscriptionsSnapshotSQL(basis = "monthly", yearsBack = 10) {
  const b = String(basis || "").toLowerCase();

  const allowed = new Set(["weekly", "monthly", "yearly"]);
  if (!allowed.has(b)) {
    throw new Error(`Invalid basis. Use one of: weekly, monthly, yearly. Got: ${basis}`);
  }

  const unit = b === "weekly" ? "week" : b === "yearly" ? "year" : "month";
  const step = b === "weekly" ? "1 week" : b === "yearly" ? "1 year" : "1 month";

  // We keep identifiers quoted to match your schema: "Subscription", "startDate", "endDate", "subscriptionID"
  return `
WITH buckets AS (
  SELECT generate_series(
    date_trunc('${unit}', CURRENT_DATE) - interval '${yearsBack} years',
    date_trunc('${unit}', CURRENT_DATE),
    interval '${step}'
  )::date AS bucket_start
)
SELECT
  bucket_start,
  COUNT(s."subscriptionID")::int AS active_subscriptions
FROM buckets b
LEFT JOIN "Subscription" s
  ON s."startDate" <= b.bucket_start
 AND (s."endDate" IS NULL OR s."endDate" > b.bucket_start)
GROUP BY bucket_start
ORDER BY bucket_start;
`.trim();
}
