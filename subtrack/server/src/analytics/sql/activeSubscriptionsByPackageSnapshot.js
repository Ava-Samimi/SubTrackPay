// server/src/analytics/sql/activeSubscriptionsByPackageSnapshot.js

/**
 * Builds SQL for: active subscriptions by package (snapshot),
 * returning count and percent share per package at "now".
 *
 * Active means:
 *  - status = 'ACTIVE'
 *  - AND (endDate IS NULL OR endDate > NOW())
 *
 * Output:
 *  - packageID (int)
 *  - subs (int)
 *  - pct (numeric rounded to 2 decimals)
 */
export function buildActiveSubscriptionsByPackageSnapshotSQL() {
  return `
SELECT
  s."packageID" AS "packageID",
  COUNT(*)::int AS "subs",
  ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS "pct"
FROM "Subscription" s
WHERE s."status" = 'ACTIVE'
  AND (s."endDate" IS NULL OR s."endDate" > NOW())
GROUP BY s."packageID"
ORDER BY "subs" DESC;
`.trim();
}
