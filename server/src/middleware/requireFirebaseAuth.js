import admin from "firebase-admin";
import fs from "fs";
import { createLogger } from "../logger.js";

const log = createLogger("middleware.auth");

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!jsonPath) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON env var (path to JSON key file).");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  log.info("Firebase Admin initialised");
}

export async function requireFirebaseAuth(req, res, next) {
  try {
    initFirebaseAdmin();

    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) {
      log.warn("Auth rejected: missing token", { path: req.path });
      return res.status(401).json({ error: "Missing token" });
    }

    req.user = await admin.auth().verifyIdToken(token);
    log.debug("Auth verified", { uid: req.user.uid, path: req.path });
    return next();
  } catch (_err) {
    log.warn("Auth rejected: invalid token", { path: req.path });
    return res.status(401).json({ error: "Invalid token" });
  }
}
