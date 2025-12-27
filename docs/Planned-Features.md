## Planned Features & System Evolution

This section outlines features that are part of the intended evolution of the
project. These capabilities may be implemented incrementally and are documented
to clarify the long-term direction of the system rather than to guarantee
immediate availability.

## CRUD Operations

Each core entity (Customer, Package, Subscription, Payment) is designed to
support full CRUD (Create, Read, Update, Delete) functionality.

These operations will be:
-	Exposed through RESTful API endpoints
-	Reflected in corresponding frontend management pages
-	Validated and governed by backend business logic
  
CRUD implementation is intended to use Prisma for most standard database access,
with the option to introduce targeted raw SQL for complex queries when justified.

## Statistics and Analytics

The system is intended to compute derived metrics based on stored transactional
data, including:

-	Revenue summaries and totals
-	Counts of active and inactive subscriptions
-	Paid versus unpaid payment ratios
-	Aggregated statistics over configurable time periods
  
These analytical results are intended to support dashboards and reporting views.

## Advanced and Future Capabilities

Planned extensions of the analytical layer include:
-	Forecasting expected billing totals based on active subscriptions
-	Time-based trend analysis of revenue and payment behavior
⦁	Identification of risk indicators such as delayed payments or potential churn
The specific implementation approaches for these features may evolve as the
project matures.
