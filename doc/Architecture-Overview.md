Architecture Overview
The application follows a client–server architecture with a clear separation of
responsibilities between presentation, business logic, and data persistence.
High-Level Architecture
The system consists of the following major components:
⦁	Frontend: React (Vite) single-page application
⦁	Backend: Node.js + Express REST API
⦁	Database: PostgreSQL accessed via Prisma ORM
⦁	Environment orchestration: Docker Compose
Frontend Layer
The frontend is responsible for:
⦁	Rendering user interfaces for managing domain entities
⦁	Displaying aggregated and statistical views derived from backend data
⦁	Communicating with the backend through HTTP requests using JSON payloads
The frontend contains no direct database access and relies exclusively on the
API for data retrieval and modification.
Backend Layer
The backend exposes RESTful endpoints that:
⦁	Validate incoming requests
⦁	Apply business rules related to subscriptions and billing
⦁	Perform CRUD operations on persistent data
⦁	Compute aggregated and statistical results used by analytical features
This layer serves as the single source of truth for application logic.
Database Layer
PostgreSQL is used as the primary data store. Prisma is employed to:
⦁	Define the database schema
⦁	Manage schema migrations
⦁	Provide type-safe and consistent database access
Prisma (ORM) Rationale
Prisma is an Object-Relational Mapping (ORM) and schema-driven database toolkit
for Node.js applications. It provides:
⦁	A declarative schema representing entities and relationships
⦁	Migration tooling to evolve the schema in a controlled manner
⦁	A type-safe client for querying PostgreSQL from backend code
Prisma vs. Raw SQL (Trade-offs)
Prisma is well-suited for application-oriented data access (typical CRUD,
standard relationships, and common filters) because it improves developer
productivity, encourages consistent access patterns, and provides type safety.
Raw SQL remains valuable for advanced analytics and performance-critical queries,
where fine-grained control over query structure, indexing strategy, and query
plans can be required. The intended approach is to use Prisma for the majority
of CRUD and standard queries, and to introduce carefully selected raw SQL queries
when complex reporting or optimization becomes necessary.
Containerization
Docker Compose ensures a reproducible development environment by orchestrating:
⦁	The frontend service
⦁	The backend API service
⦁	The PostgreSQL database service
