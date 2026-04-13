/**
 * server/src/logger.js
 *
 * Centralized logger for the API server.
 *
 * Wraps console.* with:
 *  - A consistent timestamp prefix
 *  - Named log levels: info, warn, error, debug
 *  - A "module" label so every log line is traceable to its source
 *  - debug() is silenced in production (NODE_ENV=production)
 *
 * Usage:
 *   import { createLogger } from "../logger.js";
 *   const log = createLogger("customers.routes");
 *
 *   log.info("Customer created", { customerID: 42 });
 *   log.warn("Deprecated field used");
 *   log.error("DB query failed", err);
 *   log.debug("Payload received", req.body);  // no-op in production
 */

const IS_PROD = process.env.NODE_ENV === "production";

function timestamp() {
  return new Date().toISOString();
}

function fmt(level, module, message, extra) {
  const base = `[${timestamp()}] [${level}] [${module}] ${message}`;
  return extra !== undefined ? `${base} ${JSON.stringify(extra, null, 0)}` : base;
}

export function createLogger(module) {
  return {
    info(message, extra) {
      console.log(fmt("INFO ", module, message, extra));
    },
    warn(message, extra) {
      console.warn(fmt("WARN ", module, message, extra));
    },
    error(message, errOrExtra) {
      if (errOrExtra instanceof Error) {
        console.error(fmt("ERROR", module, message), errOrExtra);
      } else {
        console.error(fmt("ERROR", module, message, errOrExtra));
      }
    },
    debug(message, extra) {
      if (!IS_PROD) {
        console.log(fmt("DEBUG", module, message, extra));
      }
    },
  };
}
