import admin from "firebase-admin";
import fs from "fs";

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
}

export async function requireFirebaseAuth(req, res, next) {
  try {
    initFirebaseAdmin();

    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
