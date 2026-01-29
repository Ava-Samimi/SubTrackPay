// client/src/pages/AnalyticsPage/hooks/analyticsFormat.js

export function shortId(id) {
  return String(id || "").slice(0, 4);
}

/**
 * Normalize payload for Analytics table
 * Fields:
 * - analysisID (handled by backend)
 * - name (required)
 * - description (optional)
 * - name_of_JSON_file (required)
 */
export function normalizeAnalyticsPayload({
  name,
  description,
  name_of_JSON_file,
}) {
  if (!name || !String(name).trim()) {
    throw new Error("name is required");
  }

  if (!name_of_JSON_file || !String(name_of_JSON_file).trim()) {
    throw new Error("name_of_JSON_file is required");
  }

  return {
    name: String(name).trim(),
    description:
      description && String(description).trim()
        ? String(description).trim()
        : null,
    name_of_JSON_file: String(name_of_JSON_file).trim(),
  };
}
