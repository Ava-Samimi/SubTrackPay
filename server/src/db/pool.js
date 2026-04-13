import pg from "pg";
import { createLogger } from "../logger.js";

const { Pool } = pg;
const log = createLogger("db.pool");

// DATABASE_URL already exists in your docker-compose:
// postgresql://app:app@db:5432/billing?schema=public
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  log.debug("New client connected to PostgreSQL pool");
});

pool.on("error", (err) => {
  log.error("Unexpected PG pool error", err);
});
