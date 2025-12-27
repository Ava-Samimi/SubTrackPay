## Data Model

The data model represents the business domain of subscription-based services and
their billing lifecycle. It is centered around four core entities that together
describe how services are offered, subscribed to, billed, and paid.

## Core Entities
-	Customer
-	Package
-	Subscription
-	Payment

## Customer

A Customer represents an individual or organization that consumes one or more services offered by the system.

Typical attributes include:
-	Unique identifier
-	Contact or identification information
=	Status indicators (e.g., active or inactive)

A customer may be associated with multiple subscriptions.

## Package

A Package represents a service or plan that can be subscribed to.

Typical attributes include:
-	Name or description
-	Billing frequency (e.g., monthly or annual)
-	Pricing information

A package may be associated with multiple subscriptions.

## Subscription

A Subscription models the contractual relationship between a customer and a package.

Typical attributes include:
-	Subscription start and end dates
-	Billing cycle configuration
-	Subscription status
-	
Subscriptions form the central link between customers, packages, and payments.

## Payment

A Payment represents a financial obligation or transaction associated with a subscription.

Typical attributes include:
-	Amount
-	Due date
⦁	Payment status (e.g., paid or unpaid)
Payments enable the system to track revenue, outstanding balances, and billing
performance over time.
