// server/src/analytics/sql/avgAmountPaidAssumed.js
//
// Assumption rules:
// - MONTHLY subscriptions pay s."price" each month while active.
//   If canceled, payments stop after the last active month.
// - ANNUAL subscriptions pay s."price" once per year on each anniversary.
//   endDate is ignored for ANNUAL (assumed always paid in full).
//
// Parameters:
//   basis = "monthly" | "yearly"
//   yearsBack = number of years to look back
//
// Output columns:
//   bucket_start
//   avg_amount_paid
//   payment_events_count
//   total_amount_paid

export function buildAvgAmountPaidAssumedSQL(basis = "monthly", yearsBack = 10) {
  const b = String(basis || "").toLowerCase();

  if (!["monthly", "yearly"].includes(b)) {
    throw new Error(`Invalid basis: ${basis}`);
  }

  const unit = b === "yearly" ? "year" : "month";

  return `
WITH payment_events AS (
  -- MONTHLY subscriptions: one payment per active month
  SELECT
    gs::date AS paid_date,
    s."price"::numeric AS amount
  FROM "Subscription" s
  JOIN LATERAL generate_series(
    date_trunc('month', s."startDate"),
    date_trunc('month', COALESCE(s."endDate", CURRENT_DATE)),
    interval '1 month'
  ) gs ON TRUE
  WHERE s."billingCycle" = 'MONTHLY'
    AND s."startDate" <= gs
    AND (s."endDate" IS NULL OR s."endDate" > gs)

  UNION ALL

  -- ANNUAL subscriptions: one payment per year on anniversary (endDate ignored)
  SELECT
    ann.pay_date::date AS paid_date,
    s."price"::numeric AS amount
  FROM "Subscription" s
  JOIN LATERAL generate_series(
    s."startDate",
    CURRENT_DATE,
    interval '1 year'
  ) ann(pay_date) ON TRUE
  WHERE s."billingCycle" = 'ANNUAL'
),
windowed AS (
  SELECT
    date_trunc('${unit}', paid_date)::date AS bucket_start,
    amount
  FROM payment_events
  WHERE paid_date >= (date_trunc('${unit}', CURRENT_DATE) - interval '${yearsBack} years')::date
)
SELECT
  bucket_start,
  AVG(amount) AS avg_amount_paid,
  COUNT(*)::int AS payment_events_count,
  SUM(amount) AS total_amount_paid
FROM windowed
GROUP BY bucket_start
ORDER BY bucket_start;
`.trim();
}
