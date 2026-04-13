// server/src/analytics/sql/activeSubscriptionAnalytics.js

/**
 * Builds SQL for calculating:
 * 1. Total number of customers with at least one active subscription
 * 2. Total number of active subscriptions
 * 3. Average subscription duration
 * 4. Revenue per customer
 */
export function buildActiveSubscriptionAnalyticsSQL() {
  return `
SELECT
    -- Total number of customers having at least one active subscription
    COUNT(DISTINCT s."customerID") AS total_customers_with_active_subscriptions,

    -- Total number of active subscriptions
    COUNT(s."subscriptionID") AS total_active_subscriptions,

    -- Average subscription duration (handling nullable endDate)
    AVG(DATE_PART('day', COALESCE(s."endDate", NOW()) - s."startDate")) AS avg_subscription_duration,

    -- Revenue per customer (sum of subscription prices / distinct customers with active subscriptions)
    SUM(s."price") / COUNT(DISTINCT s."customerID") AS revenue_per_customer

FROM
    "Subscription" s  -- Ensure correct table name with case sensitivity
WHERE
    s."status" = 'ACTIVE';  -- Only consider active subscriptions
  `.trim();
}
