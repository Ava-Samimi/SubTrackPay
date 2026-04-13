import pg from "pg";

const { Pool } = pg;

// DATABASE_URL already exists in your docker-compose:
// postgresql://app:app@db:5432/billing?schema=public
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optional: helps in some docker cases
  // ssl: false,
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err);
});
