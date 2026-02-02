// server/src/analytics/recipeSql.js
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "/app/data");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function loadSchemaAndMap() {
  const schemaPath = path.join(DATA_DIR, "db-info", "db_schema.json");
  const mapPath = path.join(DATA_DIR, "db-info", "analytics_map.json");

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`db_schema.json not found at ${schemaPath}`);
  }
  if (!fs.existsSync(mapPath)) {
    throw new Error(`analytics_map.json not found at ${mapPath}`);
  }

  const schema = readJson(schemaPath);
  const amap = readJson(mapPath);

  const models = Array.isArray(schema?.models) ? schema.models : [];
  const modelByName = new Map(models.map((m) => [m.model, m]));

  return { schema, amap, modelByName };
}

function assertModel(modelByName, modelName) {
  if (!modelByName.has(modelName)) {
    throw new Error(`Model "${modelName}" not found in db_schema.json`);
  }
}

function assertField(modelByName, modelName, fieldName) {
  const m = modelByName.get(modelName);
  const fields = (m?.fields || []).map((f) => f.name);
  if (!fields.includes(fieldName)) {
    throw new Error(
      `Field "${modelName}.${fieldName}" not found in db_schema.json. Found fields: ${fields.join(", ")}`
    );
  }
}

// map helpers
function getMapField(amap, model, key) {
  const v = amap?.models?.[model]?.[key];
  if (!v) throw new Error(`analytics_map.json missing: models.${model}.${key}`);
  return v;
}

function getOptionalMapField(amap, model, key) {
  return amap?.models?.[model]?.[key] || null;
}

// intervals
function rangeToInterval(range) {
  if (range === "10y") return "10 years";
  if (range === "5y") return "5 years";
  if (range === "12m") return "12 months";
  if (range === "6m") return "6 months";
  return "12 months";
}

// bucket expression (Postgres)
function dateBucketExpr(bucket, tableAlias, tsField) {
  const col = `${tableAlias}."${tsField}"`;
  if (bucket === "year") return `date_trunc('year', ${col})`;
  if (bucket === "week") return `date_trunc('week', ${col})`;
  return `date_trunc('month', ${col})`;
}

// quote identifier helper (minimal)
function qIdent(x) {
  return `"${String(x).replaceAll('"', '""')}"`;
}

/**
 * Build SQL for a whitelisted recipeId.
 * Returns: { sql, params, meta }
 *
 * options:
 * - bucket: week|month|year
 * - range: 6m|12m|5y|10y
 */
export function buildSqlForRecipe(recipeId, options = {}) {
  const { amap, modelByName } = loadSchemaAndMap();

  const bucket = options.bucket || "month";
  const range = options.range || "10y";
  const interval = rangeToInterval(range);

  // --- common mapped fields ---
  // Models we expect:
  // Customer, Subscription, Package, Payment (adjust if yours differ)
  const Customer = "Customer";
  const Subscription = "Subscription";
  const Package = "Package";
  const Payment = "Payment";

  // Validate required models exist if referenced
  // (We validate per-recipe below too)

  // Pull map fields (and validate they exist in schema)
  function mapped(model, key) {
    const field = getMapField(amap, model, key);
    assertModel(modelByName, model);
    assertField(modelByName, model, field);
    return field;
  }

  function mappedOptional(model, key) {
    const field = getOptionalMapField(amap, model, key);
    if (!field) return null;
    assertModel(modelByName, model);
    assertField(modelByName, model, field);
    return field;
  }

  // ----- Recipe: subscriptions count by package (active) -----
  if (recipeId === "subscriptions_count_group_by_package") {
    assertModel(modelByName, Subscription);
    assertModel(modelByName, Package);

    const subPkgId = mapped(Subscription, "packageIdField");
    const subStatus = mappedOptional(Subscription, "statusField");
    const activeVal = getOptionalMapField(amap, Subscription, "activeValue") || "active";
    const pkgName = mapped(Package, "nameField");

    // If you do not have statusField, remove the WHERE block or switch to start/end logic later.
    const where =
      subStatus ? `WHERE s.${qIdent(subStatus)} = $1` : "";

    const params = subStatus ? [activeVal] : [];

    const sql = `
      SELECT
        pk.${qIdent(pkgName)} AS package,
        COUNT(*)::int AS subscriptions
      FROM ${qIdent(Subscription)} s
      JOIN ${qIdent(Package)} pk ON pk."id" = s.${qIdent(subPkgId)}
      ${where}
      GROUP BY pk.${qIdent(pkgName)}
      ORDER BY subscriptions DESC;
    `;

    return {
      sql,
      params,
      meta: { columns: ["package", "subscriptions"], chartHint: "bar" },
    };
  }

  // ----- Recipe: customers count by package (active) -----
  if (recipeId === "customers_count_group_by_package") {
    assertModel(modelByName, Subscription);
    assertModel(modelByName, Package);

    const subPkgId = mapped(Subscription, "packageIdField");
    const subCustId = mapped(Subscription, "customerIdField");
    const subStatus = mappedOptional(Subscription, "statusField");
    const activeVal = getOptionalMapField(amap, Subscription, "activeValue") || "active";
    const pkgName = mapped(Package, "nameField");

    const where =
      subStatus ? `WHERE s.${qIdent(subStatus)} = $1` : "";
    const params = subStatus ? [activeVal] : [];

    const sql = `
      SELECT
        pk.${qIdent(pkgName)} AS package,
        COUNT(DISTINCT s.${qIdent(subCustId)})::int AS customers
      FROM ${qIdent(Subscription)} s
      JOIN ${qIdent(Package)} pk ON pk."id" = s.${qIdent(subPkgId)}
      ${where}
      GROUP BY pk.${qIdent(pkgName)}
      ORDER BY customers DESC;
    `;

    return {
      sql,
      params,
      meta: { columns: ["package", "customers"], chartHint: "bar" },
    };
  }

  // ----- Recipe: total revenue by package over time -----
  if (recipeId === "revenue_total_by_package_timeseries") {
    assertModel(modelByName, Payment);
    assertModel(modelByName, Subscription);
    assertModel(modelByName, Package);

    const payAmount = mapped(Payment, "amountField");
    const payTime = mapped(Payment, "timeField"); // e.g. createdAt/paidAt
    const paySubId = mapped(Payment, "subscriptionIdField");

    const subPkgId = mapped(Subscription, "packageIdField");
    const pkgName = mapped(Package, "nameField");

    const bucketExpr = dateBucketExpr(bucket, "p", payTime);

    const sql = `
      SELECT
        ${bucketExpr} AS bucket,
        pk.${qIdent(pkgName)} AS package,
        SUM(p.${qIdent(payAmount)})::float AS revenue
      FROM ${qIdent(Payment)} p
      JOIN ${qIdent(Subscription)} s ON s."id" = p.${qIdent(paySubId)}
      JOIN ${qIdent(Package)} pk ON pk."id" = s.${qIdent(subPkgId)}
      WHERE p.${qIdent(payTime)} >= NOW() - INTERVAL '${interval}'
      GROUP BY 1, 2
      ORDER BY 1 ASC, 3 DESC;
    `;

    return {
      sql,
      params: [],
      meta: { columns: ["bucket", "package", "revenue"], chartHint: "stacked_bar" },
    };
  }

  // ----- Recipe: average amount per customer over time -----
  if (recipeId === "avg_amount_per_customer_timeseries") {
    assertModel(modelByName, Payment);

    const payAmount = mapped(Payment, "amountField");
    const payTime = mapped(Payment, "timeField");

    // Payment may have customerId directly OR you may need to join via subscription
    const payCustId = mappedOptional(Payment, "customerIdField");
    const paySubId = mappedOptional(Payment, "subscriptionIdField");

    const bucketExpr = dateBucketExpr(bucket, "p", payTime);

    let sql = "";
    let note = "";

    if (payCustId) {
      // per bucket, per customer sum, then average
      sql = `
        WITH per_customer AS (
          SELECT
            ${bucketExpr} AS bucket,
            p.${qIdent(payCustId)} AS customer_id,
            SUM(p.${qIdent(payAmount)})::float AS customer_revenue
          FROM ${qIdent(Payment)} p
          WHERE p.${qIdent(payTime)} >= NOW() - INTERVAL '${interval}'
          GROUP BY 1, 2
        )
        SELECT
          bucket,
          AVG(customer_revenue)::float AS avg_revenue_per_customer
        FROM per_customer
        GROUP BY 1
        ORDER BY 1 ASC;
      `;
    } else if (paySubId) {
      // fallback: join Payment -> Subscription -> customerId
      assertModel(modelByName, Subscription);
      const subCustId = mapped(Subscription, "customerIdField");

      sql = `
        WITH per_customer AS (
          SELECT
            ${bucketExpr} AS bucket,
            s.${qIdent(subCustId)} AS customer_id,
            SUM(p.${qIdent(payAmount)})::float AS customer_revenue
          FROM ${qIdent(Payment)} p
          JOIN ${qIdent(Subscription)} s ON s."id" = p.${qIdent(paySubId)}
          WHERE p.${qIdent(payTime)} >= NOW() - INTERVAL '${interval}'
          GROUP BY 1, 2
        )
        SELECT
          bucket,
          AVG(customer_revenue)::float AS avg_revenue_per_customer
        FROM per_customer
        GROUP BY 1
        ORDER BY 1 ASC;
      `;
      note = "Computed customerId via Subscription join.";
    } else {
      throw new Error(
        `analytics_map.json needs Payment.customerIdField OR Payment.subscriptionIdField to compute avg per customer`
      );
    }

    return {
      sql,
      params: [],
      meta: { columns: ["bucket", "avg_revenue_per_customer"], chartHint: "line", note },
    };
  }

  throw new Error(`Unknown recipeId: ${recipeId}`);
}
