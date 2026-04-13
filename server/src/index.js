// server/src/index.js
import "dotenv/config";
import app from "./app.js";
import { createLogger } from "./logger.js";

const log = createLogger("index");
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  log.info(`API running on http://localhost:${PORT}`, { port: PORT, env: process.env.NODE_ENV || "development" });
});
